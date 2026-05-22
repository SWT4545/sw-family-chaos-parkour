'use client'
import { useEffect, useRef, MutableRefObject } from 'react'
import Matter from 'matter-js'
import { Character } from '@/types/player'
import { ChaosState, defaultChaosState } from '@/types/chaos'
import { ROOFTOP_TEST } from '@/lib/game/maps/rooftopTest'
import { trackEvent } from '@/lib/axiom/axiom'
import { TRAP_REGISTRY, CHAR_TRAP } from '@/lib/game/traps/TrapRegistry'
import { POWERUP_REGISTRY, POWERUP_SPAWNS, POWERUP_RESPAWN_MS, POWERUP_IDS } from '@/lib/game/powerups/PowerupRegistry'
import type { TrapId } from '@/lib/game/traps/TrapRegistry'
import type { PowerupId } from '@/lib/game/powerups/PowerupRegistry'

import { burst, updateParticles, drawParticles } from '@/lib/game/effects/Particles'
import {
  loadCharacterImage,
  drawCharacter,
  drawGhost,
} from '@/lib/game/renderers/characterRenderer'
import { emitCharacterParticles } from '@/lib/game/renderers/particleRenderer'
import type { Particle } from '@/lib/game/effects/Particles'
import {
  spawnTacoRain, updateTacos, drawTaco,
  TACO_RAIN_MIN_MS, TACO_RAIN_MAX_MS, TACO_RADIUS,
} from '@/lib/game/events/tacoRain'
import type { TacoEntity } from '@/lib/game/events/tacoRain'
import { getAudioSettings } from '@/lib/game/audio/AudioSettings'
import type { PlayerSyncState } from '@/lib/firebase/gameSync'

// ── Canvas / physics constants ──────────────────────────────────
const CANVAS_W  = 960
const CANVAS_H  = 540
const PLAYER_W  = 32
const PLAYER_H  = 50
const MAX_JUMPS = 2
const DEATH_Y   = ROOFTOP_TEST.height + 80
const MATCH_SECS = 8 * 60

// ── Chaos entity types ──────────────────────────────────────────
let _trapSeq = 0
interface TrapEntity {
  uid:          number
  trapId:       TrapId
  x:            number; y: number
  owner:        1 | 2
  expiresAt:    number
  triggered:    boolean   // one-shot traps consumed on first hit
  w:            number; h: number
  isSoloHazard: boolean   // permanent map obstacle; resets after cooldown
  resetAt:      number    // ms timestamp when to un-trigger (0 = not pending)
}

interface CoinEntity {
  id:        number
  x:         number; y: number
  collected: boolean
}

interface EffectState {
  type:    TrapId | PowerupId
  endsAt:  number
}

interface PowerupSpawn {
  idx:       number
  powerupId: PowerupId
  x:         number; y: number
  collected: boolean
  respawnAt: number
}

// ── Web Audio (module-level so context survives remounts) ────────
let _audioCtx: AudioContext | null = null
function getAudio() {
  if (typeof window === 'undefined') return null
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {})
    return _audioCtx
  } catch { return null }
}
function tone(freq: number, type: OscillatorType, dur: number, vol = 0.22) {
  const ctx = getAudio(); if (!ctx) return
  const { sfxMuted, sfxVolume } = getAudioSettings()
  if (sfxMuted) return
  const adjustedVol = vol * sfxVolume
  try {
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    g.gain.setValueAtTime(adjustedVol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}
const SFX = {
  trapPlace:  () => tone(220, 'square', 0.12),
  slip:       () => { tone(420, 'sine', 0.18, 0.3); setTimeout(() => tone(180, 'sine', 0.35, 0.2), 120) },
  freeze:     () => { tone(160, 'triangle', 0.22); tone(110, 'triangle', 0.3) },
  push:       () => tone(95,  'sawtooth', 0.28),
  powerup:    () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.14, 0.18), i * 75)),
  checkpoint: () => { tone(523, 'sine', 0.18, 0.28); setTimeout(() => tone(659, 'sine', 0.2, 0.28), 100) },
  victory:    () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.28, 0.35), i * 110)),
  tacoRain:   () => [330, 440, 220].forEach((f, i) => setTimeout(() => tone(f, 'sawtooth', 0.12, 0.3), i * 50)),
  tacoHit:    () => tone(280, 'square', 0.07),
  fake:       () => tone(600, 'sine', 0.08),
  coin:       () => { tone(880, 'sine', 0.08, 0.25); setTimeout(() => tone(1108, 'sine', 0.06, 0.18), 55) },
}

// ── Props ────────────────────────────────────────────────────────
export interface RemoteGhost {
  playerId:  string
  character: Character
  name:      string
  state:     { x: number; y: number; facing: number }
}

interface Props {
  player1:        Character
  player2:        Character | null
  matchStartTime: number
  mode:           'solo' | '1v1' | 'online'
  onVictory:      (winner: 1 | 2, time: number, coins: { p1: number; p2: number }) => void
  chaosRef:       MutableRefObject<ChaosState>
  remoteGhosts?:  RemoteGhost[]
  onTickSync?:    (state: PlayerSyncState) => void
}

export function GameCanvas({ player1, player2, matchStartTime, mode, onVictory, chaosRef, remoteGhosts, onTickSync }: Props) {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const onVictoryRef    = useRef(onVictory)
  const remoteGhostsRef = useRef<RemoteGhost[]>(remoteGhosts ?? [])
  const onTickSyncRef   = useRef(onTickSync)
  useEffect(() => { onVictoryRef.current  = onVictory },        [onVictory])
  useEffect(() => { remoteGhostsRef.current = remoteGhosts ?? [] }, [remoteGhosts])
  useEffect(() => { onTickSyncRef.current = onTickSync },       [onTickSync])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ── Character images (shared cache — load once, no re-decode) ─
    loadCharacterImage(player1.id)
    if (player2) loadCharacterImage(player2.id)

    // ── Movement stats ───────────────────────────────────────────
    const p1Base = player1.movementStats
    const p2Base = player2?.movementStats ?? p1Base

    // ── Matter.js engine ──────────────────────────────────────────
    const engine = Matter.Engine.create({ gravity: { y: 2.6 } })
    const world  = engine.world

    const s1 = ROOFTOP_TEST.startPositions[0]
    const s2 = ROOFTOP_TEST.startPositions[1]

    const bodyBase = {
      frictionAir: 0.025, friction: 0.06, restitution: 0,
      inertia: Infinity, inverseInertia: 0,
    } as const

    const p1Body = Matter.Bodies.rectangle(s1.x, s1.y, PLAYER_W, PLAYER_H, { ...bodyBase, label: 'player1' })
    const p2Body = player2
      ? Matter.Bodies.rectangle(s2.x, s2.y, PLAYER_W, PLAYER_H, { ...bodyBase, label: 'player2' })
      : null

    const platBodies = ROOFTOP_TEST.platforms.map((p) =>
      Matter.Bodies.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height,
        { isStatic: true, label: 'platform', friction: 0.5, restitution: 0 })
    )
    const leftWall = Matter.Bodies.rectangle(-25, ROOFTOP_TEST.height / 2, 50, ROOFTOP_TEST.height,
      { isStatic: true, label: 'wall' })

    Matter.World.add(world, [...platBodies, leftWall, p1Body, ...(p2Body ? [p2Body] : [])])

    // ── Ground detection ──────────────────────────────────────────
    const p1Gnd = new Set<number>()
    const p2Gnd = new Set<number>()

    function onColl(add: boolean, pBody: Matter.Body, gndSet: Set<number>, other: Matter.Body) {
      if (!other.isStatic) return
      if (add) { if (other.position.y > pBody.position.y) gndSet.add(other.id) }
      else gndSet.delete(other.id)
    }
    Matter.Events.on(engine, 'collisionStart', ({ pairs }) => {
      for (const { bodyA, bodyB } of pairs) {
        const [pb1, ot1] = bodyA === p1Body ? [p1Body, bodyB] : bodyB === p1Body ? [p1Body, bodyA] : [null, null]
        if (pb1) onColl(true, pb1, p1Gnd, ot1!)
        if (p2Body) {
          const [pb2, ot2] = bodyA === p2Body ? [p2Body, bodyB] : bodyB === p2Body ? [p2Body, bodyA] : [null, null]
          if (pb2) onColl(true, pb2, p2Gnd, ot2!)
        }
      }
    })
    Matter.Events.on(engine, 'collisionEnd', ({ pairs }) => {
      for (const { bodyA, bodyB } of pairs) {
        if (bodyA === p1Body || bodyB === p1Body)
          p1Gnd.delete((bodyA === p1Body ? bodyB : bodyA).id)
        if (p2Body && (bodyA === p2Body || bodyB === p2Body))
          p2Gnd.delete((bodyA === p2Body ? bodyB : bodyA).id)
      }
    })

    // ── Input ─────────────────────────────────────────────────────
    const keys     = new Set<string>()
    const prevKeys = new Set<string>()
    const onDown   = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
      keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.code)
    }
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.code)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)

    // ── Game state ────────────────────────────────────────────────
    let p1CP  = { x: s1.x, y: s1.y }
    let p2CP  = { x: s2.x, y: s2.y }
    const p1JC = { val: 0 }
    const p2JC = { val: 0 }
    let gameOver = false
    let camX = 0, camY = 0
    let lastT = performance.now()

    // ── Animation state ───────────────────────────────────────────
    let p1Anim = 0, p2Anim = 0
    let p1LandSquashT = 0, p2LandSquashT = 0
    let p1WasGrounded = true, p2WasGrounded = true
    let p1Facing: 'left' | 'right' = 'right'
    let p2Facing: 'left' | 'right' = 'right'

    // ── Chaos state ───────────────────────────────────────────────
    const activeTrapEntities: TrapEntity[] = []
    let p1TrapEffect:  EffectState | null = null
    let p2TrapEffect:  EffectState | null = null
    let p1PowerEffect: EffectState | null = null
    let p2PowerEffect: EffectState | null = null

    // Trap cooldowns per player
    const p1TrapId = CHAR_TRAP[player1.id]
    const p2TrapId = player2 ? CHAR_TRAP[player2.id] : null
    let p1TrapLastUsed  = -Infinity
    let p2TrapLastUsed  = -Infinity

    // Powerup spawns
    const powerupSpawns: PowerupSpawn[] = POWERUP_SPAWNS.map((sp, i) => ({
      idx:       i,
      powerupId: POWERUP_IDS[i % POWERUP_IDS.length],
      x: sp.x, y: sp.y,
      collected: false, respawnAt: 0,
    }))
    // Shuffle initial powerup types
    powerupSpawns.forEach((s) => {
      s.powerupId = POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)]
    })

    // Super jump storage (object refs for mutation inside move())
    const p1SJ = { val: false }
    const p2SJ = { val: false }

    // ── Coin entities ──────────────────────────────────────────────
    let p1Coins = 0
    let p2Coins = 0
    const coinsOnMap: CoinEntity[] = (ROOFTOP_TEST.coinPositions ?? []).map((pos, i) => ({
      id: i, x: pos.x, y: pos.y, collected: false,
    }))

    // ── Solo hazards (pre-placed traps) ───────────────────────────
    if (mode === 'solo') {
      for (const h of ROOFTOP_TEST.soloHazards ?? []) {
        const def = TRAP_REGISTRY[h.trapId as TrapId]
        if (!def) continue
        activeTrapEntities.push({
          uid:          ++_trapSeq,
          trapId:       h.trapId as TrapId,
          x:            h.x,
          y:            h.y,
          owner:        2,           // targets P1 (owner !== 1)
          expiresAt:    Infinity,    // permanent
          triggered:    false,
          w:            def.hitW,
          h:            def.hitH,
          isSoloHazard: true,
          resetAt:      0,
        })
      }
    }

    // Particles
    let particles: Particle[] = []

    // Screen shake
    let shakeIntensity = 0

    // Taco rain
    let tacos: TacoEntity[] = []
    let nextTacoRain = Date.now() + TACO_RAIN_MIN_MS + Math.random() * (TACO_RAIN_MAX_MS - TACO_RAIN_MIN_MS)
    let tacoRainActive = false

    // Chaos blind overlay
    let chaosBlindEndsAt = 0

    // ── Audio unlock on first key ─────────────────────────────────
    const unlockAudio = () => { getAudio(); window.removeEventListener('keydown', unlockAudio) }
    window.addEventListener('keydown', unlockAudio)

    // ── Movement helper ───────────────────────────────────────────
    function move(
      body: Matter.Body,
      lk: string, rk: string, jks: string[],
      grounded: boolean, jc: { val: number },
      base: typeof p1Base,
      trapFx: EffectState | null,
      powerFx: EffectState | null,
      superJumpPending: { val: boolean },
      maxJumps: number,
    ) {
      const now  = Date.now()
      const vel  = body.velocity

      // Freeze — no movement at all (bear_trap)
      if (trapFx?.type === 'bear_trap' && trapFx.endsAt > now) {
        Matter.Body.setVelocity(body, { x: 0, y: 0 })
        return
      }
      // Push — skip horizontal control, force leftward (giant_fan)
      if (trapFx?.type === 'giant_fan' && trapFx.endsAt > now) {
        Matter.Body.setVelocity(body, { x: -7, y: vel.y })
        return
      }

      // Effective stats
      let spd  = base.speed
      let jmp  = base.jump
      let accel = base.acceleration
      if (trapFx?.type === 'slime_puddle' && trapFx.endsAt > now) { spd *= 0.42; jmp *= 0.72; accel *= 0.7 }
      if (powerFx?.type === 'speed_shoes'  && powerFx.endsAt > now) spd  *= 1.5
      if (powerFx?.type === 'rocket_shoes' && powerFx.endsAt > now) jmp  *= 1.4

      const justJump = jks.some((k) => keys.has(k) && !prevKeys.has(k))
      if (grounded) { jc.val = 0; if (superJumpPending.val) { superJumpPending.val = false } }

      // Super jump execution (collected while airborne — activate on ground contact)
      if (superJumpPending.val && grounded) {
        superJumpPending.val = false
        Matter.Body.setVelocity(body, { x: vel.x, y: -(jmp * 2.6) })
        particles.push(...burst(body.position.x, body.position.y, '#10b981', 18, 3, 8))
        shakeIntensity = 5
        return
      }

      if (justJump && jc.val < maxJumps) {
        const jv = jc.val === 0 ? -jmp : -(jmp * 0.82)
        Matter.Body.setVelocity(body, { x: vel.x, y: jv })
        jc.val++
      }

      const targetX = keys.has(lk) ? -spd : keys.has(rk) ? spd : 0
      const lerp    = grounded ? accel : accel * 0.32
      Matter.Body.setVelocity(body, { x: vel.x + (targetX - vel.x) * lerp, y: body.velocity.y })

      // Slip override — after normal movement
      if (trapFx?.type === 'banana_peel' && trapFx.endsAt > now) {
        const wiggle = Math.sin(Date.now() * 0.015) * spd * 1.3
        Matter.Body.setVelocity(body, { x: wiggle, y: body.velocity.y })
        jc.val = maxJumps  // disable jumping while slipping
      }
    }

    function checkCPs(body: Matter.Body, cp: { x: number; y: number }, pid: 1 | 2) {
      for (const c of ROOFTOP_TEST.checkpoints) {
        if (Math.abs(body.position.x - c.x) < 55 && Math.abs(body.position.y - c.y) < 80) {
          if (c.x > cp.x) {
            SFX.checkpoint()
            trackEvent('checkpoint_hit', { player: pid, checkpoint: c.id })
            particles.push(...burst(c.x, c.y, '#fbbf24', 16))
            return { x: c.x, y: c.y }
          }
        }
      }
      return cp
    }

    function respawn(body: Matter.Body, cp: { x: number; y: number }, pid: 1 | 2, gnd: Set<number>) {
      Matter.Body.setPosition(body, { x: cp.x, y: cp.y - 45 })
      Matter.Body.setVelocity(body, { x: 0, y: 0 })
      gnd.clear()
      trackEvent('player_respawned', { player: pid, x: cp.x })
    }

    // ── Trap placement ─────────────────────────────────────────────
    function activateTrap(owner: 1 | 2) {
      const now     = Date.now()
      const tid     = owner === 1 ? p1TrapId : p2TrapId
      if (!tid) return
      const def     = TRAP_REGISTRY[tid]
      const lastUsed = owner === 1 ? p1TrapLastUsed : p2TrapLastUsed
      if (now - lastUsed < def.cooldown * 1000) return

      const body    = owner === 1 ? p1Body : p2Body
      if (!body) return

      if (owner === 1) p1TrapLastUsed = now
      else             p2TrapLastUsed = now

      const px = body.position.x
      const py = body.position.y

      activeTrapEntities.push({
        uid:          ++_trapSeq,
        trapId:       tid,
        x:            px + def.placeOffsetX,
        y:            py + (def.effectType === 'push' ? 0 : 25),
        owner,
        expiresAt:    now + def.duration * 1000 + 2000,
        triggered:    false,
        w:            def.hitW,
        h:            def.hitH,
        isSoloHazard: false,
        resetAt:      0,
      })

      SFX.trapPlace()
      particles.push(...burst(px, py, def.color, 8, 1, 4))
      trackEvent('trap_used', { player: owner, trap: tid })
    }

    // ── Trap collision ─────────────────────────────────────────────
    function checkTrapCollisions(now: number) {
      // Remove expired non-solo traps; reset solo hazards after cooldown
      for (let i = activeTrapEntities.length - 1; i >= 0; i--) {
        const trap = activeTrapEntities[i]
        if (trap.isSoloHazard) {
          if (trap.resetAt > 0 && now > trap.resetAt) {
            trap.triggered = false
            trap.resetAt   = 0
          }
          continue   // solo hazards never fully removed
        }
        if (now > trap.expiresAt) activeTrapEntities.splice(i, 1)
      }

      for (const trap of activeTrapEntities) {
        if (trap.triggered && trap.trapId !== 'slime_puddle' && trap.trapId !== 'giant_fan') continue
        const def = TRAP_REGISTRY[trap.trapId]

        // Check each player (traps only hit the opponent)
        const targets: Array<{ body: Matter.Body; pid: 1 | 2 }> = []
        if (trap.owner !== 1) targets.push({ body: p1Body, pid: 1 })
        if (trap.owner !== 2 && p2Body) targets.push({ body: p2Body, pid: 2 })

        for (const { body, pid } of targets) {
          const { x, y } = body.position
          const inZone = (
            x > trap.x - trap.w / 2 && x < trap.x + trap.w / 2 &&
            y > trap.y - trap.h / 2 && y < trap.y + trap.h / 2
          )
          if (!inZone) continue

          const effectRef = pid === 1 ? { current: p1TrapEffect } : { current: p2TrapEffect }

          // Apply effect
          if (def.effectType !== 'visual') {
            const effect: EffectState = { type: trap.trapId, endsAt: now + def.duration * 1000 }
            if (pid === 1) p1TrapEffect = effect
            else           p2TrapEffect = effect

            // Sound + particles per type
            if (def.effectType === 'slip')   { SFX.slip();   particles.push(...burst(x, y, '#fbbf24', 14)) }
            if (def.effectType === 'freeze') { SFX.freeze(); particles.push(...burst(x, y, '#60a5fa', 16)) }
            if (def.effectType === 'push')   { SFX.push();   particles.push(...burst(x, y, '#60a5fa', 10)) }
            if (def.effectType === 'slow')   {               particles.push(...burst(x, y, '#22c55e', 12)) }
            shakeIntensity = 6
            trackEvent('trap_hit', { victim: pid, trap: trap.trapId })
          } else {
            // Fake block — brief surprise slip
            if (!trap.triggered) {
              const surp: EffectState = { type: 'banana_peel', endsAt: now + 500 }
              if (pid === 1) p1TrapEffect = surp
              else           p2TrapEffect = surp
              SFX.fake()
              particles.push(...burst(x, y, '#a78bfa', 10))
              shakeIntensity = 4
              trap.expiresAt = now  // disappear immediately on contact
            }
          }

          // Mark one-shot traps consumed
          if (def.effectType !== 'slow' && def.effectType !== 'push') {
            trap.triggered = true
            // Solo hazards respawn after their cooldown period
            if (trap.isSoloHazard) trap.resetAt = now + def.cooldown * 1000
          }

          void effectRef  // silence unused lint
        }
      }
    }

    // ── Powerup collision ──────────────────────────────────────────
    function checkPowerupCollisions(now: number) {
      for (const spawn of powerupSpawns) {
        if (spawn.collected) {
          if (now >= spawn.respawnAt) {
            spawn.collected = false
            spawn.powerupId = POWERUP_IDS[Math.floor(Math.random() * POWERUP_IDS.length)]
          }
          continue
        }

        const R_PU = 24
        const targets: Array<{ body: Matter.Body; pid: 1 | 2 }> = [
          { body: p1Body, pid: 1 },
          ...(p2Body ? [{ body: p2Body, pid: 2 as const }] : []),
        ]

        for (const { body, pid } of targets) {
          const dx = body.position.x - spawn.x
          const dy = body.position.y - spawn.y
          if (dx * dx + dy * dy > R_PU * R_PU) continue

          spawn.collected = true
          spawn.respawnAt = now + POWERUP_RESPAWN_MS
          const def = POWERUP_REGISTRY[spawn.powerupId]

          // Apply powerup
          if (spawn.powerupId === 'super_jump') {
            const grounded = (pid === 1 ? p1Gnd : p2Gnd).size > 0
            if (grounded) {
              const base = pid === 1 ? p1Base : p2Base
              Matter.Body.setVelocity(body, { x: body.velocity.x, y: -(base.jump * 2.6) })
              shakeIntensity = 5
            } else {
              if (pid === 1) p1SJ.val = true
              else           p2SJ.val = true
            }
          } else if (spawn.powerupId === 'chaos_blind') {
            chaosBlindEndsAt = now + def.duration * 1000
          } else {
            const effect: EffectState = { type: spawn.powerupId, endsAt: now + def.duration * 1000 }
            if (pid === 1) p1PowerEffect = effect
            else           p2PowerEffect = effect
          }

          SFX.powerup()
          particles.push(...burst(spawn.x, spawn.y, def.color, 20, 2, 7))
          shakeIntensity = 4
          trackEvent('powerup_collected', { player: pid, powerup: spawn.powerupId })
          break
        }
      }
    }

    // ── Coin collision ────────────────────────────────────────────
    const COIN_R = 18
    function checkCoinCollisions() {
      for (const coin of coinsOnMap) {
        if (coin.collected) continue
        const targets: Array<{ body: Matter.Body; pid: 1 | 2 }> = [
          { body: p1Body, pid: 1 },
          ...(p2Body ? [{ body: p2Body, pid: 2 as const }] : []),
        ]
        for (const { body, pid } of targets) {
          const dx = body.position.x - coin.x
          const dy = body.position.y - coin.y
          if (dx * dx + dy * dy < COIN_R * COIN_R) {
            coin.collected = true
            if (pid === 1) p1Coins++
            else           p2Coins++
            SFX.coin()
            particles.push(...burst(coin.x, coin.y, '#fbbf24', 10, 2, 5))
            break
          }
        }
      }
    }

    function drawCoins(now: number) {
      for (const coin of coinsOnMap) {
        if (coin.collected) continue
        const bob   = Math.sin(now * 0.005 + coin.id * 0.7) * 3
        const cy    = coin.y + bob

        ctx.save()
        // Glow
        const grd = ctx.createRadialGradient(coin.x, cy, 0, coin.x, cy, 14)
        grd.addColorStop(0, 'rgba(251,191,36,0.55)')
        grd.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(coin.x, cy, 14, 0, Math.PI * 2); ctx.fill()
        // Core
        ctx.beginPath(); ctx.arc(coin.x, cy, 7, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'; ctx.fill()
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5; ctx.stroke()
        // Symbol
        ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = '#78350f'; ctx.fillText('C', coin.x, cy)
        ctx.restore()
      }
    }

    // ── Taco rain ──────────────────────────────────────────────────
    function tickTacoRain(now: number, dtSecs: number) {
      if (!tacoRainActive && now >= nextTacoRain) {
        tacoRainActive = true
        tacos = spawnTacoRain(camX, CANVAS_W)
        SFX.tacoRain()
        shakeIntensity = 8
        trackEvent('taco_rain_started', { camX: Math.round(camX) })
      }

      if (tacoRainActive) {
        tacos = updateTacos(tacos, ROOFTOP_TEST.height)
        const allDone = tacos.every((t) => !t.active)
        if (allDone) {
          tacoRainActive = false
          nextTacoRain = now + TACO_RAIN_MIN_MS + Math.random() * (TACO_RAIN_MAX_MS - TACO_RAIN_MIN_MS)
        }

        // Taco vs player collision
        const targets: Array<{ body: Matter.Body; pid: 1 | 2 }> = [
          { body: p1Body, pid: 1 },
          ...(p2Body ? [{ body: p2Body, pid: 2 as const }] : []),
        ]
        for (const taco of tacos) {
          if (!taco.active) continue
          for (const { body, pid } of targets) {
            const dx = taco.x - body.position.x
            const dy = taco.y - body.position.y
            if (dx * dx + dy * dy < (TACO_RADIUS + 14) * (TACO_RADIUS + 14)) {
              taco.active = false
              const slip: EffectState = { type: 'banana_peel', endsAt: now + 900 }
              if (pid === 1) p1TrapEffect = slip
              else           p2TrapEffect = slip
              SFX.tacoHit()
              particles.push(...burst(taco.x, taco.y, '#f59e0b', 14))
              shakeIntensity = Math.max(shakeIntensity, 5)
              trackEvent('taco_rain_hit', { player: pid })
            }
          }
        }
      }

      void dtSecs
    }

    // ── Rendering ─────────────────────────────────────────────────
    function drawBg() {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#04040f'); grad.addColorStop(0.65, '#0b0f28'); grad.addColorStop(1, '#141830')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      const sc = camX * 0.14
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 8237 + 411) % ROOFTOP_TEST.width) - (sc % ROOFTOP_TEST.width)
        const sy = (i * 5381 + 177) % (CANVAS_H * 0.52)
        ctx.beginPath()
        ctx.arc(((sx % CANVAS_W) + CANVAS_W) % CANVAS_W, sy, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      const bc = camX * 0.22, TW = 920
      for (let tile = -1; tile < 6; tile++) {
        const ox = tile * TW - (bc % TW)
        const bldgs: [number, number, number][] = [
          [0,78,120],[130,58,90],[190,95,115],[320,65,88],[400,85,140],
          [510,60,82],[588,100,150],[710,72,102],[800,88,98],
        ]
        for (const [bx, bw, bh] of bldgs) {
          const by = CANVAS_H - bh
          ctx.fillStyle = '#06061a'; ctx.fillRect(ox + bx, by, bw, bh)
          for (let wy = 18; wy < bh - 18; wy += 16)
            for (let wx = 6; wx < bw - 8; wx += 12)
              if ((bx + wx + wy) % 3 !== 0) {
                ctx.fillStyle = 'rgba(255,255,160,0.12)'
                ctx.fillRect(ox + bx + wx, by + wy, 7, 9)
              }
        }
      }
    }

    function drawMap() {
      for (const p of ROOFTOP_TEST.platforms) {
        ctx.fillStyle = '#22273a'; ctx.fillRect(p.x, p.y, p.width, p.height)
        ctx.fillStyle = '#343c55'; ctx.fillRect(p.x, p.y, p.width, 3)
        ctx.fillStyle = '#11141e'; ctx.fillRect(p.x, p.y + p.height - 3, p.width, 3)
        ctx.fillStyle = '#1a1e2e'; ctx.fillRect(p.x, p.y, 2, p.height)
      }

      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#10b981'
      ctx.fillText('START', s1.x + 22, ROOFTOP_TEST.platforms[0].y - 6)

      const t = Date.now() / 1000
      for (const cp of ROOFTOP_TEST.checkpoints) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 3.5 + cp.id * 1.2)
        ctx.save(); ctx.globalAlpha = pulse
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2); ctx.stroke()
        ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = '#1a1a2e'; ctx.fillText('★', cp.x, cp.y)
        ctx.font = 'bold 8px sans-serif'; ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#fbbf24'; ctx.fillText(`CP${cp.id}`, cp.x, cp.y - 15)
      }

      const fx = ROOFTOP_TEST.finishX, fy = ROOFTOP_TEST.finishY
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.setLineDash([5, 3])
      ctx.beginPath(); ctx.moveTo(fx, fy - 72); ctx.lineTo(fx, fy + 30); ctx.stroke()
      ctx.setLineDash([])
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#fff' : '#111'; ctx.fillRect(fx - 1, fy - 72 + i * 12, 12, 12)
      }
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#10b981'; ctx.fillText('FINISH', fx + 16, fy - 62)
    }

    function drawTraps(now: number) {
      for (const trap of activeTrapEntities) {
        if (now > trap.expiresAt) continue
        const def     = TRAP_REGISTRY[trap.trapId]
        const elapsed = now - (trap.expiresAt - def.duration * 1000 - 2000)
        const alpha   = Math.min(1, Math.max(0.3, 1 - elapsed / (def.duration * 1000 + 2000)))

        ctx.save()
        ctx.globalAlpha = alpha

        if (trap.trapId === 'banana_peel') {
          // Yellow ellipse banana shape
          ctx.fillStyle = '#fbbf24'
          ctx.beginPath(); ctx.ellipse(trap.x, trap.y, 22, 10, 0.3, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.ellipse(trap.x, trap.y, 22, 10, 0.3, 0, Math.PI * 2); ctx.stroke()

        } else if (trap.trapId === 'slime_puddle') {
          // Green blob — pulsing outline
          const pls = 0.7 + 0.3 * Math.sin(now * 0.006)
          ctx.fillStyle = `rgba(34,197,94,${0.55 * pls})`
          ctx.beginPath(); ctx.ellipse(trap.x, trap.y, 36, 9, 0, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.ellipse(trap.x, trap.y, 36, 9, 0, 0, Math.PI * 2); ctx.stroke()

        } else if (trap.trapId === 'giant_fan') {
          // Fan blades radiating right
          const spin = (now * 0.008) % (Math.PI * 2)
          ctx.translate(trap.x, trap.y)
          ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3
          for (let i = 0; i < 4; i++) {
            const ang = spin + i * (Math.PI / 2)
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 30, Math.sin(ang) * 30); ctx.stroke()
          }
          // Wind lines
          ctx.strokeStyle = 'rgba(96,165,250,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4])
          for (let j = 0; j < 3; j++) {
            ctx.beginPath()
            ctx.moveTo(40, -20 + j * 20); ctx.lineTo(80, -20 + j * 20); ctx.stroke()
          }
          ctx.setLineDash([])

        } else if (trap.trapId === 'fake_block') {
          // Dashed platform
          ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4])
          ctx.fillStyle = 'rgba(139,92,246,0.12)'
          ctx.fillRect(trap.x - trap.w / 2, trap.y - trap.h / 2, trap.w, trap.h)
          ctx.strokeRect(trap.x - trap.w / 2, trap.y - trap.h / 2, trap.w, trap.h)
          ctx.setLineDash([])
          ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillStyle = '#a78bfa'; ctx.fillText('?', trap.x, trap.y)

        } else if (trap.trapId === 'bear_trap') {
          // Jaw circles
          const clamp = trap.triggered ? 0 : 0.4
          ctx.strokeStyle = '#f87171'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(248,113,113,0.15)'
          ctx.beginPath(); ctx.arc(trap.x, trap.y, 16, Math.PI + clamp, Math.PI * 2 - clamp); ctx.stroke()
          ctx.beginPath(); ctx.arc(trap.x, trap.y, 16, clamp, Math.PI - clamp); ctx.stroke()
          ctx.beginPath(); ctx.arc(trap.x, trap.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        }

        ctx.restore()
      }
    }

    function drawPowerups(now: number) {
      for (const spawn of powerupSpawns) {
        if (spawn.collected) continue
        const def = POWERUP_REGISTRY[spawn.powerupId]
        const bob = Math.sin(now * 0.003 + spawn.idx * 1.2) * 5
        const pulse = 0.6 + 0.4 * Math.sin(now * 0.004 + spawn.idx)

        ctx.save()
        ctx.globalAlpha = 0.9

        // Outer glow
        ctx.beginPath()
        ctx.arc(spawn.x, spawn.y + bob, 18 * pulse, 0, Math.PI * 2)
        const grd = ctx.createRadialGradient(spawn.x, spawn.y + bob, 0, spawn.x, spawn.y + bob, 18 * pulse)
        grd.addColorStop(0, def.color + '55')
        grd.addColorStop(1, def.color + '00')
        ctx.fillStyle = grd
        ctx.fill()

        // Core circle
        ctx.beginPath()
        ctx.arc(spawn.x, spawn.y + bob, 12, 0, Math.PI * 2)
        ctx.fillStyle = def.color + 'cc'
        ctx.fill()
        ctx.strokeStyle = def.color; ctx.lineWidth = 2; ctx.stroke()

        // Icon text
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(def.icon, spawn.x, spawn.y + bob)

        ctx.restore()
      }
    }

    function drawEffectOverlays(now: number) {
      // Chaos blind strobe
      if (now < chaosBlindEndsAt) {
        const alpha = 0.55 + 0.35 * Math.sin(now * 0.025)
        ctx.save(); ctx.globalAlpha = alpha
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.restore()
      }

      // Taco rain banner
      if (tacoRainActive) {
        const bannerAlpha = 0.7 + 0.3 * Math.sin(now * 0.015)
        ctx.save(); ctx.globalAlpha = bannerAlpha
        ctx.fillStyle = '#f59e0b'
        ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillText('🌮 TACO RAIN! 🌮', CANVAS_W / 2, 8)
        ctx.restore()
      }
    }

    // ── Update chaos HUD ref (throttled ~12fps) ───────────────────
    let lastHUDSync = 0
    function syncChaosRef(now: number) {
      if (now - lastHUDSync < 80) return
      lastHUDSync = now

      const p1TDef = TRAP_REGISTRY[p1TrapId]
      const p2TDef = p2TrapId ? TRAP_REGISTRY[p2TrapId] : null
      const p1Elapsed = (now - p1TrapLastUsed) / 1000
      const p2Elapsed = (now - p2TrapLastUsed) / 1000

      function effectInfo(fx: EffectState | null): { label: string | null; color: string | null; pct: number } {
        if (!fx || fx.endsAt <= now) return { label: null, color: null, pct: 0 }
        const trapDef  = TRAP_REGISTRY[fx.type as TrapId]
        const powerDef = POWERUP_REGISTRY[fx.type as PowerupId]
        const duration = trapDef?.duration ?? powerDef?.duration ?? 2
        const pct      = Math.max(0, (fx.endsAt - now) / (duration * 1000))
        const labels: Record<string, string> = {
          banana_peel: 'SLIPPED!', slime_puddle: 'SLOWED!',
          giant_fan: 'PUSHED!', bear_trap: 'FROZEN!',
          speed_shoes: 'FAST!', rocket_shoes: 'BOOSTED!',
          double_jump: '+JUMP', chaos_blind: 'BLIND!',
        }
        const colors: Record<string, string> = {
          banana_peel: '#fbbf24', slime_puddle: '#22c55e', giant_fan: '#60a5fa',
          bear_trap: '#f87171', speed_shoes: '#f59e0b', rocket_shoes: '#ef4444',
          double_jump: '#8b5cf6', chaos_blind: '#6b7280',
        }
        return { label: labels[fx.type] ?? null, color: colors[fx.type] ?? null, pct }
      }

      const p1fx = effectInfo(p1TrapEffect ?? p1PowerEffect)
      const p2fx = effectInfo(p2TrapEffect ?? p2PowerEffect)

      chaosRef.current = {
        p1: {
          trapName:    p1TDef.displayName,
          trapIcon:    p1TDef.icon,
          cooldownPct: Math.max(0, 1 - p1Elapsed / p1TDef.cooldown),
          effectLabel: p1fx.label,
          effectColor: p1fx.color,
          effectPct:   p1fx.pct,
        },
        p2: {
          trapName:    p2TDef?.displayName ?? '',
          trapIcon:    p2TDef?.icon ?? '',
          cooldownPct: p2TDef ? Math.max(0, 1 - p2Elapsed / p2TDef.cooldown) : 0,
          effectLabel: p2fx.label,
          effectColor: p2fx.color,
          effectPct:   p2fx.pct,
        },
        tacoRainActive,
        p1Coins,
        p2Coins,
      }
    }

    // ── Online sync helpers ────────────────────────────────────────
    let syncTickCounter = 0

    // ── Main loop ──────────────────────────────────────────────────
    let rafId = 0

    function loop() {
      if (gameOver) return
      const nowMs  = Date.now()
      const nowPerf = performance.now()
      const dt     = Math.min(nowPerf - lastT, 50)
      const dtSecs = dt / 1000
      lastT = nowPerf

      // Timer
      const elapsed = (nowMs - matchStartTime) / 1000
      if (elapsed >= MATCH_SECS) {
        const winner: 1 | 2 = mode === 'solo' ? 1
          : (!p2Body || p1Body.position.x >= p2Body.position.x ? 1 : 2)
        gameOver = true
        SFX.victory()
        trackEvent('match_finished', { winner, reason: 'timer', time: elapsed })
        onVictoryRef.current(winner, elapsed, { p1: p1Coins, p2: p2Coins })
        return
      }

      // Expire effects
      if (p1TrapEffect  && nowMs > p1TrapEffect.endsAt)  p1TrapEffect  = null
      if (p2TrapEffect  && nowMs > p2TrapEffect.endsAt)  p2TrapEffect  = null
      if (p1PowerEffect && nowMs > p1PowerEffect.endsAt) p1PowerEffect = null
      if (p2PowerEffect && nowMs > p2PowerEffect.endsAt) p2PowerEffect = null

      // Trap activation (1v1 only — solo uses pre-placed hazards)
      if (mode === '1v1') {
        if (keys.has('q') && !prevKeys.has('q')) activateTrap(1)
        if (keys.has('/') && !prevKeys.has('/')) activateTrap(2)
      }

      Matter.Engine.update(engine, dt)

      const p1g = p1Gnd.size > 0
      const p2g = p2Gnd.size > 0

      // ── Animation tick + landing detection ──────────────────
      p1Anim++
      p2Anim++
      if (p1Body.velocity.x < -0.5) p1Facing = 'left'
      else if (p1Body.velocity.x > 0.5) p1Facing = 'right'
      if (p2Body) {
        if (p2Body.velocity.x < -0.5) p2Facing = 'left'
        else if (p2Body.velocity.x > 0.5) p2Facing = 'right'
      }
      if (!p1WasGrounded && p1g) p1LandSquashT = nowMs
      if (!p2WasGrounded && p2g) p2LandSquashT = nowMs
      p1WasGrounded = p1g
      p2WasGrounded = p2g

      // ── Character particles ──────────────────────────────────
      const p1FootY = p1Body.position.y + PLAYER_H / 2
      particles.push(...emitCharacterParticles({
        characterId: player1.id,
        x: p1Body.position.x, y: p1Body.position.y, footY: p1FootY,
        vx: p1Body.velocity.x, vy: p1Body.velocity.y,
        grounded: p1g, anim: p1Anim,
      }))
      if (p2Body && player2) {
        const p2FootY = p2Body.position.y + PLAYER_H / 2
        particles.push(...emitCharacterParticles({
          characterId: player2.id,
          x: p2Body.position.x, y: p2Body.position.y, footY: p2FootY,
          vx: p2Body.velocity.x, vy: p2Body.velocity.y,
          grounded: p2g, anim: p2Anim,
        }))
      }

      const p1MaxJ = p1PowerEffect?.type === 'double_jump' ? MAX_JUMPS + 1 : MAX_JUMPS
      const p2MaxJ = p2PowerEffect?.type === 'double_jump' ? MAX_JUMPS + 1 : MAX_JUMPS

      move(p1Body, 'a', 'd', ['w', ' ', 'Space', 'KeyW'], p1g, p1JC, p1Base, p1TrapEffect, p1PowerEffect, p1SJ, p1MaxJ)
      if (p2Body) move(p2Body, 'ArrowLeft', 'ArrowRight', ['ArrowUp'], p2g, p2JC, p2Base, p2TrapEffect, p2PowerEffect, p2SJ, p2MaxJ)

      p1CP = checkCPs(p1Body, p1CP, 1)
      if (p2Body) p2CP = checkCPs(p2Body, p2CP, 2)

      if (p1Body.position.y > DEATH_Y) respawn(p1Body, p1CP, 1, p1Gnd)
      if (p2Body && p2Body.position.y > DEATH_Y) respawn(p2Body, p2CP, 2, p2Gnd)

      checkTrapCollisions(nowMs)
      checkPowerupCollisions(nowMs)
      checkCoinCollisions()
      tickTacoRain(nowMs, dtSecs)

      // Update particles
      particles = updateParticles(particles, dtSecs)

      // Screen shake decay
      shakeIntensity *= 0.78

      // Finish detection
      const atFinish = (b: Matter.Body) =>
        Math.abs(b.position.x - ROOFTOP_TEST.finishX) < 75 && b.position.y < ROOFTOP_TEST.finishY + 90

      if (atFinish(p1Body)) {
        gameOver = true; SFX.victory()
        trackEvent('match_finished', { winner: 1, reason: 'finish', time: elapsed })
        onVictoryRef.current(1, elapsed, { p1: p1Coins, p2: p2Coins }); return
      }
      if (p2Body && atFinish(p2Body)) {
        gameOver = true; SFX.victory()
        trackEvent('match_finished', { winner: 2, reason: 'finish', time: elapsed })
        onVictoryRef.current(2, elapsed, { p1: p1Coins, p2: p2Coins }); return
      }

      // Camera — solo follows P1; 1v1 follows the leader
      const leadBody = (mode === '1v1' && p2Body && p2Body.position.x > p1Body.position.x)
        ? p2Body
        : p1Body
      camX += (leadBody.position.x - CANVAS_W * 0.38 - camX) * 0.09
      camY += (leadBody.position.y - CANVAS_H * 0.52 - camY) * 0.09
      camX = Math.max(0, Math.min(camX, ROOFTOP_TEST.width  - CANVAS_W))
      camY = Math.max(-60, Math.min(camY, ROOFTOP_TEST.height - CANVAS_H + 100))

      // Key snapshot for next frame edge detection
      prevKeys.clear(); keys.forEach((k) => prevKeys.add(k))

      // Update chaos HUD ref
      syncChaosRef(nowMs)

      // ── Render ───────────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      drawBg()

      // Apply screen shake
      const sx = (Math.random() - 0.5) * shakeIntensity
      const sy = (Math.random() - 0.5) * shakeIntensity * 0.6

      ctx.save()
      ctx.translate(-Math.round(camX) + sx, -Math.round(camY) + sy)
      drawMap()
      drawTraps(nowMs)
      drawPowerups(nowMs)
      drawCoins(nowMs)
      // Tacos (world-space)
      for (const taco of tacos) drawTaco(ctx, taco)
      // Remote ghost players (online mode)
      for (const ghost of remoteGhostsRef.current) {
        loadCharacterImage(ghost.character.id)
        drawGhost(ctx, ghost.character.id, ghost.character.color, ghost.name,
          ghost.state.x, ghost.state.y, ghost.state.facing)
      }
      // Players — PNG renderer with animation
      if (p2Body && player2) {
        const p2fx = p2TrapEffect ?? p2PowerEffect
        drawCharacter(ctx, {
          x: p2Body.position.x, y: p2Body.position.y,
          vx: p2Body.velocity.x, vy: p2Body.velocity.y,
          grounded: p2g, facing: p2Facing,
          anim: p2Anim, landSquashT: p2LandSquashT,
          characterId: player2.id, color: player2.color, name: player2.name,
          effectType: p2fx?.type ?? null, effectEndsAt: p2fx?.endsAt ?? 0,
          now: nowMs,
        })
      }
      drawCharacter(ctx, {
        x: p1Body.position.x, y: p1Body.position.y,
        vx: p1Body.velocity.x, vy: p1Body.velocity.y,
        grounded: p1g, facing: p1Facing,
        anim: p1Anim, landSquashT: p1LandSquashT,
        characterId: player1.id, color: player1.color, name: player1.name,
        effectType: (p1TrapEffect ?? p1PowerEffect)?.type ?? null,
        effectEndsAt: (p1TrapEffect ?? p1PowerEffect)?.endsAt ?? 0,
        now: nowMs,
      })
      // Particles (world-space)
      drawParticles(ctx, particles)
      ctx.restore()

      // Screen-space overlays (no camera offset)
      drawEffectOverlays(nowMs)

      // Online sync tick — publish position every ~9 frames (≈150ms at 60fps)
      syncTickCounter++
      if (syncTickCounter % 9 === 0 && onTickSyncRef.current) {
        onTickSyncRef.current({
          x: p1Body.position.x, y: p1Body.position.y,
          vx: p1Body.velocity.x, vy: p1Body.velocity.y,
          facing: p1Body.velocity.x < -0.5 ? -1 : 1,
          state: 'run', coins: p1Coins, checkpoint: 0, ts: Date.now(),
        })
      }

      rafId = requestAnimationFrame(loop)
    }

    trackEvent('match_started', { p1: player1.id, p2: player2?.id ?? null, map: 'rooftop-test', mode })
    rafId = requestAnimationFrame(loop)

    return () => {
      gameOver = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
      window.removeEventListener('keydown', unlockAudio)
      Matter.World.clear(world, false)
      Matter.Engine.clear(engine)
    }
  }, [player1, player2, matchStartTime, mode, chaosRef]) // onVictory via ref

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block w-full h-full bg-black"
    />
  )
}

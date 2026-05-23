'use client'
import { useEffect, useRef, MutableRefObject } from 'react'
import Matter from 'matter-js'
import { Character } from '@/types/player'
import { ChaosState, defaultChaosState } from '@/types/chaos'
import type { MapDef } from '@/types/game'
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
  CHAR_SIZES,
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
import { CosmeticInventoryManager } from '@/lib/cosmetics/CosmeticInventory'
import { COSMETICS_BY_ID } from '@/lib/cosmetics/CosmeticRegistry'

// ── Debug toggle — set true to show hitboxes / body markers ─────
const DEBUG_GAME_DRAW = false

// ── Canvas / physics constants ──────────────────────────────────
const CANVAS_W   = 960
const CANVAS_H   = 540
const ZOOM       = 1.5
const VIEWPORT_W = Math.round(CANVAS_W / ZOOM)  // 640 — world pixels visible
const VIEWPORT_H = Math.round(CANVAS_H / ZOOM)  // 360
const PLAYER_W   = 32
const PLAYER_H   = 50
const MAX_JUMPS  = 2
const DEATH_Y    = ROOFTOP_TEST.height + 80
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
  state:     PlayerSyncState
}

interface Props {
  player1:         Character
  player2:         Character | null
  matchStartTime:  number
  mode:            'solo' | '1v1' | 'online'
  onVictory:       (winner: 1 | 2, time: number, coins: { p1: number; p2: number }) => void
  chaosRef:        MutableRefObject<ChaosState>
  remoteGhosts?:   RemoteGhost[]
  onTickSync?:     (state: PlayerSyncState) => void
  onFinishSync?:   (state: PlayerSyncState) => void  // immediate publish on finish
  map?:            MapDef
}

export function GameCanvas({ player1, player2, matchStartTime, mode, onVictory, chaosRef, remoteGhosts, onTickSync, onFinishSync, map }: Props) {
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const onVictoryRef     = useRef(onVictory)
  const remoteGhostsRef  = useRef<RemoteGhost[]>(remoteGhosts ?? [])
  const onTickSyncRef    = useRef(onTickSync)
  const onFinishSyncRef  = useRef(onFinishSync)
  useEffect(() => { onVictoryRef.current    = onVictory },       [onVictory])
  useEffect(() => { remoteGhostsRef.current = remoteGhosts ?? [] }, [remoteGhosts])
  useEffect(() => { onTickSyncRef.current   = onTickSync },      [onTickSync])
  useEffect(() => { onFinishSyncRef.current = onFinishSync },    [onFinishSync])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const activeMap = map ?? ROOFTOP_TEST
    const deathY = activeMap.height + 80

    // ── DPR-aware buffer — crisp on retina displays ───────────────
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = CANVAS_W * dpr
    canvas.height = CANVAS_H * dpr
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // ── Character images (shared cache — load once, no re-decode) ─
    loadCharacterImage(player1.id)
    if (player2) loadCharacterImage(player2.id)

    // ── Movement stats ───────────────────────────────────────────
    const p1Base = player1.movementStats
    const p2Base = player2?.movementStats ?? p1Base

    // ── Matter.js engine ──────────────────────────────────────────
    const engine = Matter.Engine.create({ gravity: { y: 2.6 } })
    const world  = engine.world

    const s1 = activeMap.startPositions[0]
    const s2 = activeMap.startPositions[1]

    const bodyBase = {
      frictionAir: 0.025, friction: 0.06, restitution: 0,
      inertia: Infinity, inverseInertia: 0,
    } as const

    const p1Body = Matter.Bodies.rectangle(s1.x, s1.y, PLAYER_W, PLAYER_H, { ...bodyBase, label: 'player1' })
    const p2Body = player2
      ? Matter.Bodies.rectangle(s2.x, s2.y, PLAYER_W, PLAYER_H, { ...bodyBase, label: 'player2' })
      : null

    const platBodies = activeMap.platforms.map((p) =>
      Matter.Bodies.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height,
        { isStatic: true, label: 'platform', friction: 0.5, restitution: 0 })
    )
    const leftWall = Matter.Bodies.rectangle(-25, activeMap.height / 2, 50, activeMap.height,
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
    const coinsOnMap: CoinEntity[] = (activeMap.coinPositions ?? []).map((pos, i) => ({
      id: i, x: pos.x, y: pos.y, collected: false,
    }))

    // ── Emote state ──────────────────────────────────────────────
    const inv           = CosmeticInventoryManager.get()
    const p1EmoteIcon   = COSMETICS_BY_ID.get(inv.equippedEmote ?? '')?.icon ?? '👋'
    const p2EmoteIcon   = p1EmoteIcon  // both players share the same inventory for now
    const EMOTE_DURATION_MS = 2200
    let p1EmoteAt = 0
    let p2EmoteAt = 0

    // ── Solo hazards (pre-placed traps) ───────────────────────────
    if (mode === 'solo') {
      for (const h of activeMap.soloHazards ?? []) {
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
      lks: string[], rks: string[], jks: string[],
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

      const targetX = lks.some(k => keys.has(k)) ? -spd : rks.some(k => keys.has(k)) ? spd : 0
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
      for (const c of activeMap.checkpoints) {
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
        tacos = spawnTacoRain(camX, VIEWPORT_W)
        SFX.tacoRain()
        shakeIntensity = 8
        trackEvent('taco_rain_started', { camX: Math.round(camX) })
      }

      if (tacoRainActive) {
        tacos = updateTacos(tacos, activeMap.height)
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
      const nowT  = Date.now()
      const bg    = activeMap.background ?? 'city'
      const fShift = camX * 0.10
      const mShift = camX * 0.20

      // ─────────────────────────────────────────────────────────────
      // FACTORY — industrial smog, chimneys, smoke, orange furnace glow
      // ─────────────────────────────────────────────────────────────
      if (bg === 'factory') {
        const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
        sky.addColorStop(0, '#080300'); sky.addColorStop(0.6, '#1c0800'); sky.addColorStop(1, '#3a1200')
        ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        // Furnace floor glow
        const glow = ctx.createLinearGradient(0, CANVAS_H - 60, 0, CANVAS_H)
        glow.addColorStop(0, 'rgba(255,80,0,0)'); glow.addColorStop(1, 'rgba(255,80,0,0.35)')
        ctx.fillStyle = glow; ctx.fillRect(0, CANVAS_H - 60, CANVAS_W, 60)
        // Far factory silhouettes + chimneys
        const FTW = CANVAS_W + 60
        for (let tile = -1; tile < 3; tile++) {
          const ox = tile * FTW - (fShift % FTW)
          const shapes: [number,number,number][] = [[0,80,110],[100,50,90],[170,70,130],[270,55,100],[350,90,150],[470,60,95],[560,80,140],[690,55,110],[790,75,125],[900,45,85]]
          for (const [bx,bw,bh] of shapes) {
            ctx.fillStyle = '#0e0500'; ctx.fillRect(ox+bx, CANVAS_H-bh, bw, bh)
            // Chimney
            ctx.fillStyle = '#0a0300'; ctx.fillRect(ox+bx+bw/2-8, CANVAS_H-bh-50, 16, 55)
            ctx.beginPath(); ctx.arc(ox+bx+bw/2, CANVAS_H-bh-50, 11, Math.PI, 0); ctx.fill()
          }
        }
        // Mid level — pipes and tanks
        const MTW = CANVAS_W + 80
        for (let tile = -1; tile < 3; tile++) {
          const ox = tile * MTW - (mShift % MTW)
          const tanks: [number,number,number][] = [[0,90,130],[120,60,110],[220,110,160],[370,70,120],[470,95,170],[610,80,130],[730,100,150],[880,65,115]]
          for (const [bx,bw,bh] of tanks) {
            ctx.fillStyle = '#180800'; ctx.fillRect(ox+bx, CANVAS_H-bh, bw, bh)
            // Horizontal pipe
            ctx.fillStyle = 'rgba(255,80,0,0.18)'; ctx.fillRect(ox+bx-5, CANVAS_H-bh+20, bw+10, 10)
            // Glowing porthole
            ctx.fillStyle = 'rgba(255,120,0,0.3)'
            ctx.beginPath(); ctx.arc(ox+bx+bw/2, CANVAS_H-bh+50, 9, 0, Math.PI*2); ctx.fill()
          }
        }
        // Rising embers
        for (let i = 0; i < 24; i++) {
          const ex  = ((i*4937 + nowT*0.012*(1+i*0.08)) % (CANVAS_W+40)) - 20
          const ey  = CANVAS_H - ((nowT*0.045*(0.4+i*0.06)+i*523) % CANVAS_H)
          ctx.globalAlpha = 0.25 + 0.5*(ey/CANVAS_H)
          ctx.fillStyle = i%3===0 ? '#ffaa00' : '#ff5500'
          ctx.beginPath(); ctx.arc(ex, ey, 0.8+(i%3)*0.6, 0, Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha = 1
        // Smoke from chimneys
        for (let i = 0; i < 8; i++) {
          const sx  = (i * 137 + fShift * 0.3) % CANVAS_W
          const sy  = 30 + (i*43)%60 + 5*Math.sin(nowT*0.0005+i)
          ctx.save(); ctx.globalAlpha = 0.07+(i%3)*0.03
          ctx.fillStyle = '#554433'
          ctx.beginPath(); ctx.ellipse(sx, sy, 36+(i%3)*20, 18, 0, 0, Math.PI*2); ctx.fill()
          ctx.restore()
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // NEON — ultra-bright neon city, glowing signs, floor reflection
      // ─────────────────────────────────────────────────────────────
      if (bg === 'neon') {
        const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
        sky.addColorStop(0, '#01000a'); sky.addColorStop(0.7, '#05001a'); sky.addColorStop(1, '#0a0030')
        ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        // Neon floor reflection strip
        const ref2 = ctx.createLinearGradient(0, CANVAS_H-40, 0, CANVAS_H)
        ref2.addColorStop(0,'rgba(0,255,255,0)'); ref2.addColorStop(1,'rgba(0,255,255,0.12)')
        ctx.fillStyle = ref2; ctx.fillRect(0, CANVAS_H-40, CANVAS_W, 40)
        // Colorful stars
        const starShift = camX * 0.04
        for (let i = 0; i < 90; i++) {
          const sx = ((i*9371+313) % activeMap.width)-(starShift % activeMap.width)
          const sy = (i*4721+91) % (CANVAS_H*0.45)
          ctx.globalAlpha = 0.5+0.5*Math.sin(nowT*0.003+i*0.9)
          ctx.fillStyle = ['#ff00ff','#00ffff','#ffff00','#ff0099','#00ff99'][i%5]
          ctx.beginPath(); ctx.arc(((sx%CANVAS_W)+CANVAS_W)%CANVAS_W, sy, i%7===0?1.6:0.7, 0, Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha = 1
        // Far neon building silhouettes
        const FTW = CANVAS_W + 60; const signs=['▲','◆','●','★','■']
        const neonCols=['#ff00ff','#00ffff','#ffff00','#ff0066','#00ff99','#9900ff']
        for (let tile = -1; tile < 3; tile++) {
          const ox = tile*FTW-(fShift%FTW)
          const shapes:[number,number,number][] = [[0,60,100],[75,45,80],[140,70,130],[240,50,95],[310,80,145],[420,55,100],[500,85,160],[635,60,110],[730,75,135],[860,50,95]]
          for (const [bx,bw,bh] of shapes) {
            ctx.fillStyle='#02000e'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
          }
        }
        // Mid buildings with neon signs
        const MTW = CANVAS_W+80
        for (let tile=-1; tile<3; tile++) {
          const ox=tile*MTW-(mShift%MTW)
          const bldgs:[number,number,number][]= [[0,75,120],[105,55,100],[200,90,160],[320,65,110],[415,95,170],[545,75,125],[640,100,175],[785,80,135],[890,60,105]]
          for (const [bx,bw,bh] of bldgs) {
            ctx.fillStyle='#030012'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
            // Neon windows
            for (let wy=14;wy<bh-12;wy+=20) for (let wx=6;wx<bw-6;wx+=16) {
              if ((bx+wx*3+wy*7)%7<2) {
                const nc=neonCols[(bx+wy)%neonCols.length]
                ctx.fillStyle=nc.replace(')',',0.25)').replace('rgb','rgba').replace('#','rgba(').replace(/([0-9a-f]{2})/gi, (_,h)=>parseInt(h,16)+',')
                ctx.fillStyle=`rgba(${parseInt(nc.slice(1,3),16)},${parseInt(nc.slice(3,5),16)},${parseInt(nc.slice(5,7),16)},0.3)`
                ctx.fillRect(ox+bx+wx,CANVAS_H-bh+wy,10,12)
              }
            }
            // Neon rooftop sign
            const nc2=neonCols[(bx*3+bh)%neonCols.length]
            ctx.globalAlpha=0.8+0.2*Math.sin(nowT*0.003+bx*0.05); ctx.fillStyle=nc2
            ctx.fillRect(ox+bx,CANVAS_H-bh,bw,3)
            ctx.globalAlpha=0.25; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,12)
            ctx.globalAlpha=1
            // Random neon sign text area
            if (bw>70) {
              const sc=neonCols[(bx+bh)%neonCols.length]
              ctx.strokeStyle=sc; ctx.lineWidth=1.5; ctx.globalAlpha=0.7
              ctx.strokeRect(ox+bx+8,CANVAS_H-bh+20,bw-16,22)
              ctx.globalAlpha=0.5; ctx.fillStyle=sc
              ctx.font='bold 9px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'
              ctx.fillText(signs[(bx*7+bh)%signs.length], ox+bx+bw/2, CANVAS_H-bh+31)
              ctx.globalAlpha=1
            }
          }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // PLAYROOM — bright toy room interior, blocks, window, shelves
      // ─────────────────────────────────────────────────────────────
      if (bg === 'playroom') {
        // Wall color
        ctx.fillStyle='#1a3a5c'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Daytime window
        const winX=CANVAS_W/2-80, winW=160, winY=20, winH=90
        const winSky=ctx.createLinearGradient(0,winY,0,winY+winH)
        winSky.addColorStop(0,'#87ceeb'); winSky.addColorStop(1,'#c8e6f5')
        ctx.fillStyle=winSky; ctx.fillRect(winX,winY,winW,winH)
        // Window clouds
        ctx.fillStyle='rgba(255,255,255,0.85)'
        ctx.beginPath(); ctx.ellipse(winX+40+(nowT*0.005%40),winY+25,25,12,0,0,Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(winX+110+(nowT*0.003%30),winY+40,20,10,0,0,Math.PI*2); ctx.fill()
        // Window frame
        ctx.strokeStyle='#8B6914'; ctx.lineWidth=4
        ctx.strokeRect(winX-2,winY-2,winW+4,winH+4)
        ctx.beginPath(); ctx.moveTo(winX+winW/2,winY); ctx.lineTo(winX+winW/2,winY+winH); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(winX,winY+winH/2); ctx.lineTo(winX+winW,winY+winH/2); ctx.stroke()
        // Background toy shelf
        const shelfY=CANVAS_H-160
        ctx.fillStyle='#4a2800'; ctx.fillRect(0,shelfY,CANVAS_W,12)
        // Toy blocks on shelf (far layer — slow parallax)
        const blockColors=['#e63946','#2196f3','#ffd93d','#4caf50','#ff9800','#9c27b0']
        const fBlocks:[number,number,number][] = [[30,50,50],[100,40,40],[160,55,55],[240,45,45],[310,50,50],[390,40,40],[460,55,55],[540,50,50],[620,40,40],[700,55,55],[780,45,45],[860,50,50]]
        const fbShift = fShift * 0.8
        for (const [bx,bw,bh] of fBlocks) {
          const rx = (((bx-fbShift)%CANVAS_W)+CANVAS_W+100)%CANVAS_W - 50
          ctx.fillStyle=blockColors[(bx+bh)%blockColors.length]
          ctx.globalAlpha=0.4; ctx.fillRect(rx,shelfY-bh,bw,bh)
          ctx.globalAlpha=1
          // Block letter
          ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`bold ${bw*0.35}px sans-serif`
          ctx.textAlign='center'; ctx.textBaseline='middle'
          ctx.fillText('ABC'[(bx+bh)%3], rx+bw/2, shelfY-bh/2)
        }
        // Second shelf
        const shelf2Y = CANVAS_H-260
        ctx.fillStyle='#4a2800'; ctx.fillRect(0,shelf2Y,CANVAS_W,12)
        const mbShift = mShift * 0.7
        for (const [bx,bw,bh] of fBlocks) {
          const rx = (((bx+200-mbShift)%CANVAS_W)+CANVAS_W+100)%CANVAS_W - 50
          ctx.fillStyle=blockColors[(bx+bw)%blockColors.length]
          ctx.globalAlpha=0.55; ctx.fillRect(rx,shelf2Y-bh+5,bw-5,bh-5)
          ctx.globalAlpha=1
        }
        // Star/fun decorations on wall
        const starCols=['#ffd93d','#ff6b6b','#6bcb77']
        for (let i=0;i<12;i++) {
          const sx=((i*173+mShift*0.1)%CANVAS_W+CANVAS_W)%CANVAS_W
          const sy=80+(i*53)%130
          ctx.globalAlpha=0.2+0.1*Math.sin(nowT*0.002+i)
          ctx.fillStyle=starCols[i%3]; ctx.font='14px sans-serif'; ctx.textAlign='center'
          ctx.fillText('✦',sx,sy); ctx.globalAlpha=1
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // FORTRESS — dark pine forest, stone towers with battlements
      // ─────────────────────────────────────────────────────────────
      if (bg === 'fortress') {
        const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
        sky.addColorStop(0,'#000802'); sky.addColorStop(0.6,'#001a06'); sky.addColorStop(1,'#002808')
        ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Moon
        ctx.fillStyle='rgba(200,220,180,0.6)'; ctx.beginPath(); ctx.arc(CANVAS_W*0.15,50,22,0,Math.PI*2); ctx.fill()
        ctx.fillStyle='rgba(0,15,5,0.4)'; ctx.beginPath(); ctx.arc(CANVAS_W*0.15+8,46,18,0,Math.PI*2); ctx.fill()
        // Stars (green-tinted)
        const starShift=camX*0.04
        for (let i=0;i<60;i++) {
          const sx=((i*9371+313)%activeMap.width)-(starShift%activeMap.width)
          ctx.globalAlpha=0.3+0.4*Math.sin(nowT*0.002+i)
          ctx.fillStyle=i%5===0?'#a8d8a8':'#d0e8d0'
          ctx.beginPath(); ctx.arc(((sx%CANVAS_W)+CANVAS_W)%CANVAS_W,(i*4721+91)%(CANVAS_H*0.45),0.7,0,Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha=1
        // Far pine trees
        const FTW=CANVAS_W+40
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*FTW-(fShift%FTW)
          const trees:[number,number,number][]= [[0,30,80],[40,25,65],[75,32,85],[115,28,75],[155,35,90],[200,25,70],[240,30,80],[280,28,72],[325,33,88],[370,26,68],[410,30,78],[455,32,84],[500,27,73],[540,34,92],[590,28,76],[630,30,82],[680,25,66]]
          for (const [tx,tw,th] of trees) {
            ctx.fillStyle='#001a04'
            ctx.beginPath(); ctx.moveTo(ox+tx+tw/2,CANVAS_H-th); ctx.lineTo(ox+tx,CANVAS_H); ctx.lineTo(ox+tx+tw,CANVAS_H); ctx.closePath(); ctx.fill()
            ctx.beginPath(); ctx.moveTo(ox+tx+tw/2,CANVAS_H-th*0.65); ctx.lineTo(ox+tx-6,CANVAS_H-th*0.2); ctx.lineTo(ox+tx+tw+6,CANVAS_H-th*0.2); ctx.closePath(); ctx.fill()
          }
        }
        // Mid layer — towers + denser trees
        const MTW=CANVAS_W+80
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*MTW-(mShift%MTW)
          // Stone towers
          const towers:[number,number,number][] = [[80,50,130],[250,60,150],[440,45,120],[650,55,140],[850,50,125]]
          for (const [tx,tw,th] of towers) {
            ctx.fillStyle='#0a1206'; ctx.fillRect(ox+tx,CANVAS_H-th,tw,th)
            // Battlements
            for (let bx2=0;bx2<tw;bx2+=14) {
              ctx.fillStyle='#0a1206'; ctx.fillRect(ox+tx+bx2,CANVAS_H-th-16,10,16)
            }
            // Slit windows
            ctx.fillStyle='rgba(255,200,50,0.4)'
            ctx.fillRect(ox+tx+tw/2-3,CANVAS_H-th+20,6,18)
            ctx.fillRect(ox+tx+tw/2-3,CANVAS_H-th+55,6,18)
            // Torch
            ctx.fillStyle='rgba(255,140,0,0.5+0.3*Math.sin(nowT*0.005+tx))'
            const flicker=0.4+0.4*Math.sin(nowT*0.008+tx)
            ctx.globalAlpha=flicker; ctx.fillStyle='#ff8800'
            ctx.beginPath(); ctx.arc(ox+tx+tw/2,CANVAS_H-th-22,4,0,Math.PI*2); ctx.fill()
            ctx.globalAlpha=1
          }
          // Mid pine trees (denser)
          const midTrees:[number,number,number][]= [[20,22,60],[55,18,50],[100,24,68],[148,20,56],[200,22,62],[255,18,52],[308,26,72],[365,20,58],[420,23,65],[478,19,54],[530,25,70],[588,21,60],[648,22,64],[705,18,50],[758,24,68],[815,20,56],[870,22,62]]
          for (const [tx,tw,th] of midTrees) {
            ctx.fillStyle='#001505'
            ctx.beginPath(); ctx.moveTo(ox+tx+tw/2,CANVAS_H-th); ctx.lineTo(ox+tx,CANVAS_H); ctx.lineTo(ox+tx+tw,CANVAS_H); ctx.closePath(); ctx.fill()
            ctx.beginPath(); ctx.moveTo(ox+tx+tw/2,CANVAS_H-th*0.7); ctx.lineTo(ox+tx-4,CANVAS_H-th*0.25); ctx.lineTo(ox+tx+tw+4,CANVAS_H-th*0.25); ctx.closePath(); ctx.fill()
          }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // DOMAIN — dramatic sunset, fancy skyline silhouettes
      // ─────────────────────────────────────────────────────────────
      if (bg === 'domain') {
        const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
        sky.addColorStop(0,'#0a0018'); sky.addColorStop(0.35,'#2d0040'); sky.addColorStop(0.65,'#8c1a00'); sky.addColorStop(0.85,'#d44000'); sky.addColorStop(1,'#ff7700')
        ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Sun disc at horizon
        const sunG=ctx.createRadialGradient(CANVAS_W/2,CANVAS_H,10,CANVAS_W/2,CANVAS_H,180)
        sunG.addColorStop(0,'rgba(255,200,50,0.5)'); sunG.addColorStop(0.4,'rgba(255,100,0,0.25)'); sunG.addColorStop(1,'rgba(255,60,0,0)')
        ctx.fillStyle=sunG; ctx.fillRect(0,CANVAS_H-180,CANVAS_W,180)
        // Atmospheric haze
        const haze=ctx.createLinearGradient(0,CANVAS_H-80,0,CANVAS_H)
        haze.addColorStop(0,'rgba(255,80,0,0)'); haze.addColorStop(1,'rgba(200,40,0,0.3)')
        ctx.fillStyle=haze; ctx.fillRect(0,CANVAS_H-80,CANVAS_W,80)
        // Moving clouds silhouettes
        for (let i=0;i<5;i++) {
          const cs=(nowT*0.00004+i*0.4)*CANVAS_W*0.5
          const cx2=((i*230+cs-(camX*0.05))%(CANVAS_W*1.5)+CANVAS_W*1.5)%(CANVAS_W*1.5)-120
          ctx.globalAlpha=0.12+i*0.02; ctx.fillStyle='#200030'
          ctx.beginPath(); ctx.ellipse(cx2,50+(i*28)%40,90+(i*20)%60,25,0,0,Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha=1
        // Far fancy skyline (spires + antenna tops)
        const FTW=CANVAS_W+60
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*FTW-(fShift%FTW)
          const spires:[number,number,number][]= [[0,50,110],[60,40,90],[110,80,160],[210,55,120],[285,90,180],[400,60,130],[490,85,175],[610,50,115],[680,75,155],[790,55,120],[870,45,100]]
          for (const [bx,bw,bh] of spires) {
            // Building body
            ctx.fillStyle='#0a0010'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
            // Spire / pointed top
            ctx.beginPath(); ctx.moveTo(ox+bx+bw/2,CANVAS_H-bh-30); ctx.lineTo(ox+bx+8,CANVAS_H-bh); ctx.lineTo(ox+bx+bw-8,CANVAS_H-bh); ctx.closePath(); ctx.fill()
            // Antenna
            ctx.fillStyle='rgba(255,150,50,0.4)'; ctx.fillRect(ox+bx+bw/2-1,CANVAS_H-bh-55,2,30)
            ctx.beginPath(); ctx.arc(ox+bx+bw/2,CANVAS_H-bh-56,3,0,Math.PI*2); ctx.fill()
          }
        }
        // Mid — grander skyscrapers with lit windows
        const MTW=CANVAS_W+80
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*MTW-(mShift%MTW)
          const grand:[number,number,number][]= [[0,70,150],[90,55,120],[165,95,200],[290,65,140],[380,100,210],[510,75,160],[610,90,195],[740,60,130],[820,85,180]]
          for (const [bx,bw,bh] of grand) {
            ctx.fillStyle='#080012'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
            // Gold-tinted windows
            for (let wy=18;wy<bh-14;wy+=22) for (let wx=7;wx<bw-7;wx+=18) {
              if ((bx+wx*3+wy*7)%6<2) {
                ctx.fillStyle='rgba(255,160,30,0.22)'; ctx.fillRect(ox+bx+wx,CANVAS_H-bh+wy,11,14)
              }
            }
            // Gold rooftop
            ctx.globalAlpha=0.7; ctx.fillStyle='#ff9900'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,2)
            ctx.globalAlpha=0.18; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,10); ctx.globalAlpha=1
            // Tapered top
            ctx.fillStyle='#080012'
            ctx.beginPath(); ctx.moveTo(ox+bx+bw*0.15,CANVAS_H-bh); ctx.lineTo(ox+bx+bw/2,CANVAS_H-bh-35); ctx.lineTo(ox+bx+bw*0.85,CANVAS_H-bh); ctx.closePath(); ctx.fill()
          }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // CHAOS — shifting psychedelic scene, glitch effects
      // ─────────────────────────────────────────────────────────────
      if (bg === 'chaos') {
        const t=nowT*0.0004
        const r1=Math.floor(5+8*Math.sin(t)), g1=Math.floor(0+5*Math.cos(t*1.3)), b1=Math.floor(10+8*Math.sin(t*0.7))
        const r2=Math.floor(8+6*Math.cos(t*0.8)), g2=Math.floor(0+3*Math.sin(t*1.1)), b2=Math.floor(12+7*Math.cos(t*0.9))
        const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
        sky.addColorStop(0,`rgb(${r1},${g1},${b1})`); sky.addColorStop(0.5,`rgb(${b2},${r2},${g2})`); sky.addColorStop(1,`rgb(${g1},${b1},${r1})`)
        ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Floating glitch rectangles
        const glitchCols=['#ff006e','#00f5ff','#c8ff00','#ff4d00','#8000ff','#00ff88']
        for (let i=0;i<14;i++) {
          const gx=((i*173+nowT*0.008*(1+i*0.15))%(CANVAS_W+100))-50
          const gy=(i*137+nowT*0.006*(1+i*0.1))%(CANVAS_H*0.7)
          const gw=20+i*8; const gh=6+i*3
          ctx.globalAlpha=0.12+0.08*Math.sin(t*3+i)
          ctx.fillStyle=glitchCols[i%glitchCols.length]
          ctx.fillRect(gx,gy,gw,gh)
        }
        ctx.globalAlpha=1
        // Warping sine-wave bands
        for (let y=0;y<CANVAS_H;y+=22) {
          const amp=8*Math.sin(t*2+y*0.04)
          ctx.globalAlpha=0.04; ctx.fillStyle=glitchCols[Math.floor(y/22)%glitchCols.length]
          ctx.fillRect(amp,y,CANVAS_W,10); ctx.globalAlpha=1
        }
        // Chaos silhouettes — same shapes every tile but color-shifting
        const FTW=CANVAS_W+60
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*FTW-(fShift%FTW)
          const shapes:[number,number,number][]= [[0,65,100],[90,50,80],[155,75,130],[255,55,95],[330,80,145],[445,60,105],[535,85,155],[660,65,115],[755,78,138],[868,55,98]]
          for (const [bx,bw,bh] of shapes) {
            const hue=(bx*5+nowT*0.05)%360
            ctx.fillStyle=`hsla(${hue},100%,10%,0.9)`; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
            ctx.fillStyle=`hsla(${(hue+120)%360},100%,60%,0.8)`;ctx.fillRect(ox+bx,CANVAS_H-bh,bw,2)
          }
        }
        const MTW=CANVAS_W+80
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*MTW-(mShift%MTW)
          const bldgs:[number,number,number][]= [[0,78,130],[108,58,108],[210,92,165],[325,68,118],[420,98,180],[555,78,134],[655,102,185],[798,82,142],[895,62,112]]
          for (const [bx,bw,bh] of bldgs) {
            const hue2=(bx*7+nowT*0.07+180)%360
            ctx.fillStyle=`hsla(${hue2},100%,6%,1)`; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh)
            for (let wy=14;wy<bh-14;wy+=20) for (let wx=6;wx<bw-6;wx+=16) {
              if ((bx+wx+wy)%5<2) {
                ctx.fillStyle=`hsla(${(hue2+wx*10)%360},100%,50%,0.25)`;ctx.fillRect(ox+bx+wx,CANVAS_H-bh+wy,10,12)
              }
            }
            ctx.globalAlpha=0.9; ctx.fillStyle=`hsla(${hue2},100%,60%,1)`;ctx.fillRect(ox+bx,CANVAS_H-bh,bw,3)
            ctx.globalAlpha=0.3; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,14); ctx.globalAlpha=1
          }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // VOLCANO — erupting lava, dark rocky mountains, ash particles
      // ─────────────────────────────────────────────────────────────
      if (bg === 'volcano') {
        const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
        sky.addColorStop(0,'#050000'); sky.addColorStop(0.5,'#1f0400'); sky.addColorStop(0.85,'#400c00'); sky.addColorStop(1,'#200000')
        ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Lava glow at bottom
        const lavaG=ctx.createLinearGradient(0,CANVAS_H-70,0,CANVAS_H)
        lavaG.addColorStop(0,'rgba(255,60,0,0)'); lavaG.addColorStop(0.6,'rgba(255,80,0,0.4)'); lavaG.addColorStop(1,'rgba(255,120,0,0.7)')
        ctx.fillStyle=lavaG; ctx.fillRect(0,CANVAS_H-70,CANVAS_W,70)
        // Volcanic mountains (triangular jagged shapes)
        const FTW=CANVAS_W+80
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*FTW-(fShift%FTW)
          const peaks:[number,number][]= [[0,130],[100,90],[200,160],[340,110],[460,145],[590,95],[700,155],[820,120],[940,100]]
          for (let i=0;i<peaks.length-1;i++) {
            const [px,ph]=peaks[i]; const [nx]=peaks[i+1]
            ctx.fillStyle='#0d0100'
            ctx.beginPath(); ctx.moveTo(ox+px,CANVAS_H); ctx.lineTo(ox+px+(nx-px)/2,CANVAS_H-ph); ctx.lineTo(ox+nx,CANVAS_H); ctx.closePath(); ctx.fill()
          }
        }
        // Mid — closer rocky crags
        const MTW=CANVAS_W+80
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*MTW-(mShift%MTW)
          const crags:[number,number][]= [[0,170],[130,120],[270,190],[420,140],[560,180],[700,130],[840,170],[980,115]]
          for (let i=0;i<crags.length-1;i++) {
            const [px,ph]=crags[i]; const [nx,nh]=crags[i+1]
            ctx.fillStyle='#1a0200'
            ctx.beginPath(); ctx.moveTo(ox+px,CANVAS_H); ctx.lineTo(ox+(px+nx)/2,CANVAS_H-Math.max(ph,nh)*0.9); ctx.lineTo(ox+nx,CANVAS_H); ctx.closePath(); ctx.fill()
          }
          // Lava crack
          ctx.strokeStyle='rgba(255,80,0,0.35)'; ctx.lineWidth=2
          ctx.beginPath(); ctx.moveTo(ox,CANVAS_H-30)
          for (let x2=0;x2<MTW;x2+=20) { ctx.lineTo(ox+x2,CANVAS_H-25+((x2*17)%20)-10) }
          ctx.stroke()
        }
        // Rising embers
        for (let i=0;i<30;i++) {
          const ex=((i*4937+nowT*0.015*(1+i*0.07))%(CANVAS_W+40))-20
          const ey=CANVAS_H-((nowT*0.055*(0.35+i*0.06)+i*523)%CANVAS_H)
          ctx.globalAlpha=0.2+0.6*(ey/CANVAS_H)
          ctx.fillStyle=i%4===0?'#ffaa00':i%4===1?'#ff6600':'#ff3300'
          ctx.beginPath(); ctx.arc(ex,ey,0.7+(i%3)*0.7,0,Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha=1
        // Ash clouds
        for (let i=0;i<7;i++) {
          const cs=(nowT*0.00006+i*0.3)*CANVAS_W*0.5
          const cx2=((i*190+cs-camX*0.04)%(CANVAS_W*1.4)+CANVAS_W*1.4)%(CANVAS_W*1.4)-120
          ctx.save(); ctx.globalAlpha=0.1+(i%3)*0.025
          ctx.fillStyle='#2a1206'
          ctx.beginPath(); ctx.ellipse(cx2,30+(i*38)%55,70+(i%3)*30,22,0,0,Math.PI*2); ctx.fill()
          ctx.restore()
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // SCHOOL — bright daytime, blue sky, school exterior
      // ─────────────────────────────────────────────────────────────
      if (bg === 'school') {
        const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
        sky.addColorStop(0,'#1a6eb5'); sky.addColorStop(0.5,'#3b9edc'); sky.addColorStop(1,'#6dc7f0')
        ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
        // Sun
        ctx.save(); ctx.globalAlpha=0.9; ctx.fillStyle='#ffe066'
        ctx.beginPath(); ctx.arc(CANVAS_W*0.85,45,28,0,Math.PI*2); ctx.fill()
        ctx.globalAlpha=0.2; ctx.beginPath(); ctx.arc(CANVAS_W*0.85,45,44,0,Math.PI*2); ctx.fill()
        ctx.restore()
        // Clouds
        for (let i=0;i<5;i++) {
          const cs=(nowT*0.00003+i*0.35)*CANVAS_W*0.5
          const cx2=((i*210+cs-camX*0.05)%(CANVAS_W*1.4)+CANVAS_W*1.4)%(CANVAS_W*1.4)-120
          ctx.save(); ctx.globalAlpha=0.75+(i%3)*0.08
          ctx.fillStyle='#ffffff'
          ctx.beginPath(); ctx.ellipse(cx2,35+(i*25)%35,65+(i%3)*25,22,0,0,Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.ellipse(cx2-28,40+(i*25)%35,40,18,0,0,Math.PI*2); ctx.fill()
          ctx.beginPath(); ctx.ellipse(cx2+28,42+(i*25)%35,38,17,0,0,Math.PI*2); ctx.fill()
          ctx.restore()
        }
        // Grass strip
        ctx.fillStyle='#2d7d2d'; ctx.fillRect(0,CANVAS_H-40,CANVAS_W,40)
        // School building silhouettes
        const FTW=CANVAS_W+60
        for (let tile=-1;tile<3;tile++) {
          const ox=tile*FTW-(fShift%FTW)
          ctx.fillStyle='#c8a060'; ctx.fillRect(ox,CANVAS_H-90,300,90)
          ctx.fillRect(ox+400,CANVAS_H-80,250,80)
          // Windows
          for (let wx=20;wx<290;wx+=50) { ctx.fillStyle='#88bbee'; ctx.fillRect(ox+wx,CANVAS_H-75,30,30) }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // CITY (default) — night skyline, stars, moon, neon windows
      // ─────────────────────────────────────────────────────────────
      const sky=ctx.createLinearGradient(0,0,0,CANVAS_H)
      sky.addColorStop(0,'#01010c'); sky.addColorStop(0.55,'#05081c'); sky.addColorStop(1,'#0e1232')
      ctx.fillStyle=sky; ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
      // Moon
      ctx.save(); ctx.globalAlpha=0.6; ctx.fillStyle='#e8e4c8'
      ctx.beginPath(); ctx.arc(CANVAS_W*0.78,38,20,0,Math.PI*2); ctx.fill()
      ctx.globalAlpha=0.35; ctx.fillStyle='#0a0818'
      ctx.beginPath(); ctx.arc(CANVAS_W*0.78+9,34,16,0,Math.PI*2); ctx.fill()
      ctx.restore()
      // Stars
      const starShift=camX*0.04
      for (let i=0;i<110;i++) {
        const sx=((i*9371+313)%activeMap.width)-(starShift%activeMap.width)
        const sy=(i*4721+91)%(CANVAS_H*0.48)
        ctx.globalAlpha=(0.45+0.55*Math.sin(nowT*0.002+i*0.73))*0.8
        ctx.fillStyle=i%11===0?'#b8d4ff':i%13===0?'#ffd8a8':'#ffffff'
        ctx.beginPath(); ctx.arc(((sx%CANVAS_W)+CANVAS_W)%CANVAS_W,sy,i%7===0?1.4:0.7,0,Math.PI*2); ctx.fill()
      }
      ctx.globalAlpha=1
      // Far city
      const FTW=CANVAS_W+30
      const farBldgs:[number,number,number][]= [[0,65,90],[80,45,72],[155,72,118],[260,52,82],[335,68,125],[450,48,78],[520,88,142],[655,62,102],[745,78,118],[868,55,94]]
      for (let tile=-1;tile<3;tile++) {
        const ox=tile*FTW-(fShift%FTW)
        for (const [bx,bw,bh] of farBldgs) { ctx.fillStyle='#040410'; ctx.fillRect(ox+bx,CANVAS_H-bh,bw,bh) }
      }
      // Mid city with windows
      const MTW=CANVAS_W+80
      const neonPalette=['#60a5fa','#ec4899','#34d399','#f59e0b','#a78bfa','#fb923c']
      const midBldgs:[number,number,number][]= [[0,75,120],[105,55,96],[198,88,152],[316,65,102],[408,92,162],[538,72,118],[630,97,172],[768,76,128],[878,62,108]]
      for (let tile=-1;tile<3;tile++) {
        const ox=tile*MTW-(mShift%MTW)
        for (const [bx,bw,bh] of midBldgs) {
          const by=CANVAS_H-bh
          ctx.fillStyle='#070722'; ctx.fillRect(ox+bx,by,bw,bh)
          for (let wy=12;wy<bh-10;wy+=18) for (let wx=5;wx<bw-5;wx+=14) {
            const wk=(bx+wx*3+wy*7)%8
            if (wk<2) { ctx.fillStyle='rgba(96,165,250,0.17)'; ctx.fillRect(ox+bx+wx,by+wy,9,11) }
            else if (wk===3) { ctx.fillStyle='rgba(251,191,36,0.13)'; ctx.fillRect(ox+bx+wx,by+wy,9,11) }
          }
          const nc=neonPalette[(bx*3+bh)%neonPalette.length]
          ctx.globalAlpha=0.55; ctx.fillStyle=nc; ctx.fillRect(ox+bx,by,bw,2)
          ctx.globalAlpha=0.14; ctx.fillRect(ox+bx,by,bw,9); ctx.globalAlpha=1
        }
      }
      // Clouds
      const cloudShift=camX*0.07
      for (let i=0;i<6;i++) {
        const cs=(nowT*0.00005+i*0.37)*CANVAS_W*0.5
        const cx2=((i*185+cs-cloudShift)%(CANVAS_W*1.4)+CANVAS_W*1.4)%(CANVAS_W*1.4)-120
        ctx.save(); ctx.globalAlpha=0.04+(i%3)*0.018
        ctx.fillStyle='#8090e0'
        ctx.beginPath(); ctx.ellipse(cx2,42+(i*43)%58,88+(i*31)%72,20,0,0,Math.PI*2); ctx.fill()
        ctx.restore()
      }
    }

    function drawMap() {
      const bg = activeMap.background ?? 'city'
      // Per-theme platform appearance
      const ptTheme: Record<string,{c0:string,c1:string,c2:string,edge:string,side:string}> = {
        factory:  {c0:'#3a1800',c1:'#200c00',c2:'#100500',edge:'rgba(255,120,0,0.9)',  side:'rgba(255,80,0,0.22)'},
        neon:     {c0:'#12003a',c1:'#0a0025',c2:'#04000f',edge:'rgba(200,0,255,0.95)', side:'rgba(160,0,255,0.3)'},
        playroom: {c0:'#5a3010',c1:'#3a1e08',c2:'#1e0e02',edge:'rgba(255,220,50,0.95)',side:'rgba(255,180,0,0.3)'},
        fortress: {c0:'#1c2418',c1:'#121810',c2:'#080c06',edge:'rgba(80,200,60,0.9)',  side:'rgba(60,160,40,0.25)'},
        domain:   {c0:'#2a1800',c1:'#180e00',c2:'#0c0600',edge:'rgba(255,180,50,0.95)',side:'rgba(255,140,0,0.28)'},
        chaos:    {c0:'#1a001a',c1:'#0e000e',c2:'#060006',edge:'rgba(255,0,200,0.95)', side:'rgba(200,0,255,0.3)'},
        volcano:  {c0:'#2a0600',c1:'#180300',c2:'#0c0100',edge:'rgba(255,60,0,0.95)',  side:'rgba(255,40,0,0.28)'},
        school:   {c0:'#2a2a2a',c1:'#181818',c2:'#0c0c0c',edge:'rgba(255,220,0,0.9)',  side:'rgba(200,180,0,0.25)'},
        city:     {c0:'#2a3254',c1:'#1c2040',c2:'#0c0e1c',edge:'rgba(110,210,255,0.95)',side:'rgba(90,140,220,0.22)'},
      }
      const pt = ptTheme[bg] ?? ptTheme.city

      for (const p of activeMap.platforms) {
        // Body
        const bodyGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height)
        bodyGrad.addColorStop(0, pt.c0); bodyGrad.addColorStop(0.4, pt.c1); bodyGrad.addColorStop(1, pt.c2)
        ctx.fillStyle = bodyGrad
        ctx.fillRect(p.x, p.y, p.width, p.height)

        // Hazard stripes on wide platforms
        if (p.width > 280) {
          ctx.save(); ctx.globalAlpha = 0.06; ctx.fillStyle = '#f59e0b'
          for (let dx = 0; dx < p.width; dx += 52) ctx.fillRect(p.x + dx, p.y, 26, p.height)
          ctx.restore()
        }

        // Glowing top edge
        const edgeGrad = ctx.createLinearGradient(0, p.y, 0, p.y + 5)
        edgeGrad.addColorStop(0, pt.edge); edgeGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = edgeGrad; ctx.fillRect(p.x, p.y, p.width, 5)

        // Side edges
        ctx.fillStyle = pt.side
        ctx.fillRect(p.x, p.y, 2, p.height); ctx.fillRect(p.x + p.width - 2, p.y, 2, p.height)

        // Bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2)

        // Bolt dots
        if (p.width > 80) {
          ctx.save(); ctx.fillStyle = pt.side
          const boltXs = [9, p.width - 13]
          if (p.width > 160) boltXs.push(Math.round(p.width / 2))
          for (const bx of boltXs) { ctx.beginPath(); ctx.arc(p.x + bx, p.y + Math.round(p.height / 2), 2.5, 0, Math.PI * 2); ctx.fill() }
          ctx.restore()
        }
      }

      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#10b981'
      ctx.fillText('START', s1.x + 22, activeMap.platforms[0].y - 6)

      const t = Date.now() / 1000
      for (const cp of activeMap.checkpoints) {
        const cpId = cp.id ?? 0
        const pulse = 0.65 + 0.35 * Math.sin(t * 3.5 + cpId * 1.2)
        ctx.save(); ctx.globalAlpha = pulse
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2); ctx.stroke()
        ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = '#1a1a2e'; ctx.fillText('★', cp.x, cp.y)
        ctx.font = 'bold 8px sans-serif'; ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#fbbf24'; ctx.fillText(`CP${cpId}`, cp.x, cp.y - 15)
      }

      const fx = activeMap.finishX, fy = activeMap.finishY
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
        let winner: 1 | 2 = 1
        if (mode === '1v1') {
          winner = (!p2Body || p1Body.position.x >= p2Body.position.x) ? 1 : 2
        } else if (mode === 'online') {
          // Compare local player X against furthest remote ghost
          const bestGhostX = remoteGhostsRef.current.length > 0
            ? remoteGhostsRef.current.reduce((max, g) => Math.max(max, g.state?.x ?? -Infinity), -Infinity)
            : -Infinity
          winner = p1Body.position.x >= bestGhostX ? 1 : 2
        }
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

      // Trap activation (1v1 / online)
      if (mode !== 'solo') {
        // P1: Q (WASD layout) or E (arrow-key layout)
        const p1TrapJust = (keys.has('q') && !prevKeys.has('q')) || (keys.has('e') && !prevKeys.has('e'))
        if (p1TrapJust) activateTrap(1)
        if (mode === '1v1') {
          if (keys.has('/') && !prevKeys.has('/')) activateTrap(2)
        }
      }

      // Emote trigger — F for P1, ] for P2
      if (keys.has('f') && !prevKeys.has('f')) p1EmoteAt = nowMs
      if (mode === '1v1' && keys.has(']') && !prevKeys.has(']')) p2EmoteAt = nowMs

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
      if (!p1WasGrounded && p1g) {
        p1LandSquashT = nowMs
        if (Math.abs(p1Body.velocity.y) > 2) {
          const p1FootY = p1Body.position.y + PLAYER_H / 2
          particles.push(...burst(p1Body.position.x, p1FootY, '#94a3b8', 6, 1.8, 3.5))
        }
      }
      if (!p2WasGrounded && p2g) {
        p2LandSquashT = nowMs
        if (p2Body && Math.abs(p2Body.velocity.y) > 2) {
          const p2FootY = p2Body.position.y + PLAYER_H / 2
          particles.push(...burst(p2Body.position.x, p2FootY, '#94a3b8', 6, 1.8, 3.5))
        }
      }
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

      // In 1v1 P2 owns the arrow keys — P1 uses WASD only to avoid conflicts
      const p1lks = mode === '1v1' ? ['a']                      : ['a', 'ArrowLeft']
      const p1rks = mode === '1v1' ? ['d']                      : ['d', 'ArrowRight']
      const p1jks = mode === '1v1' ? ['w', ' ', 'Space', 'KeyW'] : ['w', ' ', 'Space', 'KeyW', 'ArrowUp']
      move(p1Body, p1lks, p1rks, p1jks, p1g, p1JC, p1Base, p1TrapEffect, p1PowerEffect, p1SJ, p1MaxJ)
      if (p2Body) move(p2Body, ['ArrowLeft'], ['ArrowRight'], ['ArrowUp'], p2g, p2JC, p2Base, p2TrapEffect, p2PowerEffect, p2SJ, p2MaxJ)

      p1CP = checkCPs(p1Body, p1CP, 1)
      if (p2Body) p2CP = checkCPs(p2Body, p2CP, 2)

      if (p1Body.position.y > deathY) respawn(p1Body, p1CP, 1, p1Gnd)
      if (p2Body && p2Body.position.y > deathY) respawn(p2Body, p2CP, 2, p2Gnd)

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
        Math.abs(b.position.x - activeMap.finishX) < 75 && b.position.y < activeMap.finishY + 90

      // Local P1 finish always takes priority (prevents stale remote-finished flag from stealing win)
      if (atFinish(p1Body)) {
        // In online mode, immediately broadcast finish so remote players know we won
        if (mode === 'online' && onFinishSyncRef.current) {
          onFinishSyncRef.current({
            x: p1Body.position.x, y: p1Body.position.y,
            vx: 0, vy: 0, facing: p1Facing === 'right' ? 1 : -1,
            state: 'finished', finished: true, coins: p1Coins, checkpoint: 0, ts: Date.now(),
          })
        }
        gameOver = true; SFX.victory()
        trackEvent('match_finished', { winner: 1, reason: 'finish', time: elapsed })
        onVictoryRef.current(1, elapsed, { p1: p1Coins, p2: p2Coins }); return
      }
      if (p2Body && atFinish(p2Body)) {
        gameOver = true; SFX.victory()
        trackEvent('match_finished', { winner: 2, reason: 'finish', time: elapsed })
        onVictoryRef.current(2, elapsed, { p1: p1Coins, p2: p2Coins }); return
      }
      // Remote ghost finish check — only after local player checks, prevents stale flag from stealing win
      if (mode === 'online') {
        for (const ghost of remoteGhostsRef.current) {
          if (ghost?.state?.finished) {
            gameOver = true; SFX.victory()
            trackEvent('match_finished', { winner: 2, reason: 'remote_finish', time: elapsed })
            onVictoryRef.current(2, elapsed, { p1: p1Coins, p2: 0 }); return
          }
        }
      }

      // Camera — solo follows P1; 1v1 follows the leader
      const leadBody = (mode === '1v1' && p2Body && p2Body.position.x > p1Body.position.x)
        ? p2Body
        : p1Body
      camX += (leadBody.position.x - VIEWPORT_W * 0.38 - camX) * 0.09
      camY += (leadBody.position.y - VIEWPORT_H * 0.52 - camY) * 0.09
      camX = Math.max(0, Math.min(camX, activeMap.width  - VIEWPORT_W))
      camY = Math.max(-60, Math.min(camY, activeMap.height - VIEWPORT_H + 100))

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
      ctx.scale(ZOOM, ZOOM)
      ctx.translate(-Math.round(camX) + sx / ZOOM, -Math.round(camY) + sy / ZOOM)
      drawMap()
      drawTraps(nowMs)
      drawPowerups(nowMs)
      drawCoins(nowMs)
      // Tacos (world-space)
      for (const taco of tacos) drawTaco(ctx, taco)
      // Remote ghost players (online mode)
      for (const ghost of remoteGhostsRef.current) {
        if (!ghost?.character || !ghost.state) continue
        loadCharacterImage(ghost.character.id)
        drawGhost(ctx, ghost.character.id, ghost.character.color ?? '#888', ghost.name ?? '?',
          ghost.state.x ?? 0, ghost.state.y ?? 0, ghost.state.facing ?? 1)
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

      // Emotes (world-space, above character head)
      function drawEmote(wx: number, wy: number, icon: string, triggeredAt: number) {
        const age = nowMs - triggeredAt
        if (age <= 0 || age > EMOTE_DURATION_MS) return
        const t       = age / EMOTE_DURATION_MS
        const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1
        const rise    = -30 * t
        ctx.save()
        ctx.globalAlpha = fadeOut
        ctx.font        = '28px serif'
        ctx.textAlign   = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(icon, wx, wy + rise)
        ctx.restore()
      }
      const p1Size = CHAR_SIZES[player1.id] ?? { w: 80, h: 110 }
      drawEmote(p1Body.position.x, p1Body.position.y + 25 - p1Size.h - 10, p1EmoteIcon, p1EmoteAt)
      if (p2Body && player2) {
        const p2Size = CHAR_SIZES[player2.id] ?? { w: 80, h: 110 }
        drawEmote(p2Body.position.x, p2Body.position.y + 25 - p2Size.h - 10, p2EmoteIcon, p2EmoteAt)
      }

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
  }, [player1, player2, matchStartTime, mode, chaosRef, map]) // onVictory via ref

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block w-full h-full bg-black"
    />
  )
}

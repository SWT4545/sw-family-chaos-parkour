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
import { CHARACTER_ALIGNMENT, applyCanvasAlignment } from '@/lib/game/assets/AssetRegistry'
import { burst, updateParticles, drawParticles } from '@/lib/game/effects/Particles'
import type { Particle } from '@/lib/game/effects/Particles'
import {
  spawnTacoRain, updateTacos, drawTaco,
  TACO_RAIN_MIN_MS, TACO_RAIN_MAX_MS, TACO_RADIUS,
} from '@/lib/game/events/tacoRain'
import type { TacoEntity } from '@/lib/game/events/tacoRain'

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
  uid:       number
  trapId:    TrapId
  x:         number; y: number
  owner:     1 | 2
  expiresAt: number
  triggered: boolean  // one-shot traps consumed on first hit
  w:         number; h: number
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
  try {
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    g.gain.setValueAtTime(vol, ctx.currentTime)
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
}

// ── Props ────────────────────────────────────────────────────────
interface Props {
  player1:        Character
  player2:        Character | null
  matchStartTime: number
  onVictory:      (winner: 1 | 2, elapsedSeconds: number) => void
  chaosRef:       MutableRefObject<ChaosState>
}

export function GameCanvas({ player1, player2, matchStartTime, onVictory, chaosRef }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const onVictoryRef = useRef(onVictory)
  useEffect(() => { onVictoryRef.current = onVictory }, [onVictory])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ── Character images ─────────────────────────────────────────
    const p1Img = (() => { const i = new Image(); i.src = player1.assets.full; return i })()
    const p2Img = player2 ? (() => { const i = new Image(); i.src = player2.assets.full; return i })() : null

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
        uid:       ++_trapSeq,
        trapId:    tid,
        x:         px + def.placeOffsetX,
        y:         py + (def.effectType === 'push' ? 0 : 25),
        owner,
        expiresAt: now + def.duration * 1000 + 2000,
        triggered: false,
        w:         def.hitW,
        h:         def.hitH,
      })

      SFX.trapPlace()
      particles.push(...burst(px, py, def.color, 8, 1, 4))
      trackEvent('trap_used', { player: owner, trap: tid })
    }

    // ── Trap collision ─────────────────────────────────────────────
    function checkTrapCollisions(now: number) {
      // Remove expired traps
      for (let i = activeTrapEntities.length - 1; i >= 0; i--) {
        if (now > activeTrapEntities[i].expiresAt) activeTrapEntities.splice(i, 1)
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

    function drawPlayer(body: Matter.Body, char: Character, img: HTMLImageElement | null, label: string, effect: EffectState | null, now: number) {
      const { x, y } = body.position
      const color = char.color

      // Effect tint
      let tintAlpha = 0, tintColor = '#fff'
      if (effect?.type === 'bear_trap'   && effect.endsAt > now) { tintColor = '#60a5fa'; tintAlpha = 0.45 }
      if (effect?.type === 'slime_puddle' && effect.endsAt > now) { tintColor = '#22c55e'; tintAlpha = 0.35 }

      // Drop shadow
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000'
      ctx.beginPath(); ctx.ellipse(x, y + PLAYER_H / 2 + 3, PLAYER_W / 2 - 2, 5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Sprite or color fallback (with registry alignment)
      ctx.save()
      ctx.beginPath(); ctx.rect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H); ctx.clip()
      if (img && img.complete && img.naturalWidth > 0) {
        const align = CHARACTER_ALIGNMENT[char.id]
        ctx.save()
        applyCanvasAlignment(ctx, x, y, PLAYER_W, PLAYER_H, align)
        ctx.drawImage(img, x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
        ctx.restore()
      } else {
        ctx.fillStyle = color; ctx.fillRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, 7)
      }
      // Effect tint overlay
      if (tintAlpha > 0) {
        ctx.fillStyle = tintColor; ctx.globalAlpha = tintAlpha
        ctx.fillRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
      }
      ctx.restore()

      // Freeze ice cracks
      if (effect?.type === 'bear_trap' && effect.endsAt > now) {
        ctx.save(); ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + (Math.cos(i * 1.57) * 20), y + (Math.sin(i * 1.57) * 25))
          ctx.stroke()
        }
        ctx.restore()
      }

      // Border
      ctx.strokeStyle = color; ctx.lineWidth = 2
      ctx.strokeRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)

      // Name tag
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      const tw = Math.max(ctx.measureText(label).width, ctx.measureText(char.name).width) + 8
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x - tw / 2, y - PLAYER_H / 2 - 18, tw, 15)
      ctx.fillStyle = color; ctx.fillText(char.name, x, y - PLAYER_H / 2 - 5)

      // Alignment debug overlay
      if (process.env.NEXT_PUBLIC_DEBUG_IMAGE_ALIGNMENT === 'true') {
        const align = CHARACTER_ALIGNMENT[char.id]
        const ax = x + (align.anchorX - 0.5) * PLAYER_W
        const ay = y + (align.anchorY - 0.5) * PLAYER_H
        ctx.save()
        // Bounding box
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([2, 2])
        ctx.strokeRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
        ctx.setLineDash([])
        // Center cross
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke()
        // Anchor dot
        ctx.fillStyle = '#60a5fa'
        ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, Math.PI * 2); ctx.fill()
        // Offset label
        ctx.font = '6px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillStyle = '#ef4444'
        ctx.fillText(`x${align.offsetX} y${align.offsetY} s${align.scale}`, x - PLAYER_W / 2, y + PLAYER_H / 2 + 2)
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
      }
    }

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
        const winner: 1 | 2 = !p2Body || p1Body.position.x >= p2Body.position.x ? 1 : 2
        gameOver = true
        SFX.victory()
        trackEvent('match_finished', { winner, reason: 'timer', time: elapsed })
        onVictoryRef.current(winner, elapsed)
        return
      }

      // Expire effects
      if (p1TrapEffect  && nowMs > p1TrapEffect.endsAt)  p1TrapEffect  = null
      if (p2TrapEffect  && nowMs > p2TrapEffect.endsAt)  p2TrapEffect  = null
      if (p1PowerEffect && nowMs > p1PowerEffect.endsAt) p1PowerEffect = null
      if (p2PowerEffect && nowMs > p2PowerEffect.endsAt) p2PowerEffect = null

      // Trap activation (edge detection)
      if (keys.has('q') && !prevKeys.has('q')) activateTrap(1)
      if (keys.has('/') && !prevKeys.has('/')) activateTrap(2)

      Matter.Engine.update(engine, dt)

      const p1g = p1Gnd.size > 0
      const p2g = p2Gnd.size > 0

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
        onVictoryRef.current(1, elapsed); return
      }
      if (p2Body && atFinish(p2Body)) {
        gameOver = true; SFX.victory()
        trackEvent('match_finished', { winner: 2, reason: 'finish', time: elapsed })
        onVictoryRef.current(2, elapsed); return
      }

      // Camera
      const leadBody = p2Body && p2Body.position.x > p1Body.position.x ? p2Body : p1Body
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
      // Tacos (world-space)
      for (const taco of tacos) drawTaco(ctx, taco)
      // Players
      if (p2Body && player2) drawPlayer(p2Body, player2, p2Img, 'P2', p2TrapEffect ?? p2PowerEffect, nowMs)
      drawPlayer(p1Body, player1, p1Img, 'P1', p1TrapEffect ?? p1PowerEffect, nowMs)
      // Particles (world-space)
      drawParticles(ctx, particles)
      ctx.restore()

      // Screen-space overlays (no camera offset)
      drawEffectOverlays(nowMs)

      rafId = requestAnimationFrame(loop)
    }

    trackEvent('match_started', { p1: player1.id, p2: player2?.id ?? null, map: 'rooftop-test' })
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
  }, [player1, player2, matchStartTime, chaosRef]) // onVictory via ref

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block w-full h-full bg-black"
    />
  )
}

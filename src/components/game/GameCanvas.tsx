'use client'
import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { Character } from '@/types/player'
import { ROOFTOP_TEST } from '@/lib/game/maps/rooftopTest'
import { trackEvent } from '@/lib/axiom/axiom'

// ── Physics constants ─────────────────────────────────────────
const CANVAS_W = 960
const CANVAS_H = 540
const PLAYER_W = 32
const PLAYER_H = 50
const MAX_JUMPS = 2
const JUMP_VEL   = -17   // first jump
const JUMP2_VEL  = -14   // second (weaker) jump
const MAX_SPD    = 8.5
const DEATH_Y    = ROOFTOP_TEST.height + 80
const MATCH_SECS = 8 * 60

// ── Sprite sheet character crops [sx%, sy%, sw%, sh%] ─────────
const CROPS: Record<string, [number, number, number, number]> = {
  commander: [0.14, 0.01, 0.21, 0.64],
  bj:        [0.35, 0.01, 0.21, 0.64],
  brae:      [0.55, 0.01, 0.20, 0.64],
  xanny:     [0.75, 0.01, 0.20, 0.64],
}

const COLORS: Record<string, string> = {
  commander: '#dc2626',
  bj:        '#f59e0b',
  brae:      '#8b5cf6',
  xanny:     '#06b6d4',
}

interface Props {
  player1: Character
  player2: Character | null
  matchStartTime: number
  onVictory: (winner: 1 | 2, elapsedSeconds: number) => void
}

export function GameCanvas({ player1, player2, matchStartTime, onVictory }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const onVictoryRef = useRef(onVictory)
  useEffect(() => { onVictoryRef.current = onVictory }, [onVictory])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    // ── Engine setup ─────────────────────────────────────────
    const engine = Matter.Engine.create({ gravity: { y: 2.6 } })
    const world  = engine.world

    const s1 = ROOFTOP_TEST.startPositions[0]
    const s2 = ROOFTOP_TEST.startPositions[1]

    const bodyBase = {
      frictionAir: 0.025, friction: 0.06, restitution: 0,
      inertia: Infinity,  inverseInertia: 0,
    } as const

    const p1Body = Matter.Bodies.rectangle(s1.x, s1.y, PLAYER_W, PLAYER_H,
      { ...bodyBase, label: 'player1' })
    const p2Body = player2
      ? Matter.Bodies.rectangle(s2.x, s2.y, PLAYER_W, PLAYER_H,
          { ...bodyBase, label: 'player2' })
      : null

    const platBodies = ROOFTOP_TEST.platforms.map((p) =>
      Matter.Bodies.rectangle(
        p.x + p.width / 2, p.y + p.height / 2, p.width, p.height,
        { isStatic: true, label: 'platform', friction: 0.5, restitution: 0 }
      )
    )

    const leftWall = Matter.Bodies.rectangle(
      -25, ROOFTOP_TEST.height / 2, 50, ROOFTOP_TEST.height,
      { isStatic: true, label: 'wall' }
    )

    Matter.World.add(world, [...platBodies, leftWall, p1Body, ...(p2Body ? [p2Body] : [])])

    // ── Ground detection ─────────────────────────────────────
    const p1Gnd = new Set<number>()
    const p2Gnd = new Set<number>()

    function onColl(add: boolean, pBody: Matter.Body, gndSet: Set<number>, other: Matter.Body) {
      if (!other.isStatic) return
      if (add) {
        if (other.position.y > pBody.position.y) gndSet.add(other.id)
      } else {
        gndSet.delete(other.id)
      }
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
        if (bodyA === p1Body || bodyB === p1Body) {
          const other = bodyA === p1Body ? bodyB : bodyA
          p1Gnd.delete(other.id)
        }
        if (p2Body && (bodyA === p2Body || bodyB === p2Body)) {
          const other = bodyA === p2Body ? bodyB : bodyA
          p2Gnd.delete(other.id)
        }
      }
    })

    // ── Input ────────────────────────────────────────────────
    const keys     = new Set<string>()
    const prevKeys = new Set<string>()

    const onDown = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
      keys.add(e.code)
    }
    const onUp = (e: KeyboardEvent) => keys.delete(e.code)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)

    // ── Game state ───────────────────────────────────────────
    let p1CP      = { x: s1.x, y: s1.y }
    let p2CP      = { x: s2.x, y: s2.y }
    const p1JC    = { val: 0 }
    const p2JC    = { val: 0 }
    let gameOver  = false
    let camX = 0, camY = 0
    let lastT = performance.now()

    const sheet = new Image()
    sheet.src = '/family-chaos-character-sheet.png'

    // ── Helpers ──────────────────────────────────────────────
    function move(
      body: Matter.Body,
      lk: string, rk: string, jks: string[],
      grounded: boolean, jc: { val: number }
    ) {
      const vel = body.velocity
      const justJump = jks.some((k) => keys.has(k) && !prevKeys.has(k))

      if (grounded) jc.val = 0

      if (justJump && jc.val < MAX_JUMPS) {
        Matter.Body.setVelocity(body, { x: vel.x, y: jc.val === 0 ? JUMP_VEL : JUMP2_VEL })
        jc.val++
      }

      const goLeft  = keys.has(lk)
      const goRight = keys.has(rk)
      const targetX = goLeft ? -MAX_SPD : goRight ? MAX_SPD : 0
      const lerp    = grounded ? 0.28 : 0.09
      Matter.Body.setVelocity(body, { x: vel.x + (targetX - vel.x) * lerp, y: body.velocity.y })
    }

    function checkCPs(body: Matter.Body, cp: { x: number; y: number }, pid: 1 | 2) {
      for (const c of ROOFTOP_TEST.checkpoints) {
        if (Math.abs(body.position.x - c.x) < 55 && Math.abs(body.position.y - c.y) < 80) {
          if (c.x > cp.x) {
            trackEvent('checkpoint_hit', { player: pid, checkpoint: c.id })
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

    // ── Render helpers ────────────────────────────────────────
    function drawBg() {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      grad.addColorStop(0, '#04040f')
      grad.addColorStop(0.65, '#0b0f28')
      grad.addColorStop(1, '#141830')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Stars — parallax layer
      const sc = camX * 0.14
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 8237 + 411) % ROOFTOP_TEST.width) - (sc % ROOFTOP_TEST.width)
        const sy = (i * 5381 + 177) % (CANVAS_H * 0.52)
        ctx.beginPath()
        ctx.arc(((sx % CANVAS_W) + CANVAS_W) % CANVAS_W, sy, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // Building silhouettes — parallax layer
      const bc = camX * 0.22
      const TW  = 920
      ctx.fillStyle = '#06061a'
      for (let tile = -1; tile < 6; tile++) {
        const ox = tile * TW - (bc % TW)
        const bldgs = [
          [0, 78, 120], [130, 58, 90], [190, 95, 115],
          [320, 65, 88], [400, 85, 140], [510, 60, 82],
          [588, 100, 150], [710, 72, 102], [800, 88, 98],
        ] as [number, number, number][]
        for (const [bx, bw, bh] of bldgs) {
          const by = CANVAS_H - bh
          ctx.fillStyle = '#06061a'
          ctx.fillRect(ox + bx, by, bw, bh)
          // Windows
          for (let wy = 18; wy < bh - 18; wy += 16) {
            for (let wx = 6; wx < bw - 8; wx += 12) {
              if ((bx + wx + wy) % 3 !== 0) {
                ctx.fillStyle = 'rgba(255,255,160,0.12)'
                ctx.fillRect(ox + bx + wx, by + wy, 7, 9)
              }
            }
          }
        }
      }
    }

    function drawMap() {
      // Platforms
      for (const p of ROOFTOP_TEST.platforms) {
        ctx.fillStyle = '#22273a'
        ctx.fillRect(p.x, p.y, p.width, p.height)
        ctx.fillStyle = '#343c55'   // top highlight
        ctx.fillRect(p.x, p.y, p.width, 3)
        ctx.fillStyle = '#11141e'   // bottom shadow
        ctx.fillRect(p.x, p.y + p.height - 3, p.width, 3)
        ctx.fillStyle = '#1a1e2e'   // left edge
        ctx.fillRect(p.x, p.y, 2, p.height)
      }

      // START label
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#10b981'
      ctx.fillText('START', s1.x + 22, ROOFTOP_TEST.platforms[0].y - 6)

      // Checkpoints
      const t = Date.now() / 1000
      for (const cp of ROOFTOP_TEST.checkpoints) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 3.5 + cp.id * 1.2)
        ctx.save()
        ctx.globalAlpha = pulse
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cp.x, cp.y, 13, 0, Math.PI * 2)
        ctx.stroke()
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#1a1a2e'
        ctx.fillText('★', cp.x, cp.y)
        ctx.font = 'bold 8px sans-serif'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(`CP${cp.id}`, cp.x, cp.y - 15)
      }

      // Finish line
      const fx = ROOFTOP_TEST.finishX
      const fy = ROOFTOP_TEST.finishY
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(fx, fy - 72)
      ctx.lineTo(fx, fy + 30)
      ctx.stroke()
      ctx.setLineDash([])
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111'
        ctx.fillRect(fx - 1, fy - 72 + i * 12, 12, 12)
      }
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = '#10b981'
      ctx.fillText('FINISH', fx + 16, fy - 62)
    }

    function drawPlayer(body: Matter.Body, char: Character, label: string) {
      const { x, y } = body.position
      const color = COLORS[char.id] ?? '#fff'
      const crop  = CROPS[char.id]

      // Drop shadow
      ctx.save()
      ctx.globalAlpha = 0.22
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.ellipse(x, y + PLAYER_H / 2 + 3, PLAYER_W / 2 - 2, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Sprite (clipped rect)
      ctx.save()
      ctx.beginPath()
      ctx.rect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
      ctx.clip()
      if (crop && sheet.complete && sheet.naturalWidth > 0) {
        const sw = sheet.naturalWidth, sh = sheet.naturalHeight
        ctx.drawImage(
          sheet,
          crop[0] * sw, crop[1] * sh, crop[2] * sw, crop[3] * sh,
          x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H
        )
      } else {
        ctx.fillStyle = color
        ctx.fillRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        ctx.fillRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, 7)
      }
      ctx.restore()

      // Border
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H)

      // Name tag
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const tw = Math.max(ctx.measureText(label).width, ctx.measureText(char.name).width) + 8
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(x - tw / 2, y - PLAYER_H / 2 - 18, tw, 15)
      ctx.fillStyle = color
      ctx.fillText(char.name, x, y - PLAYER_H / 2 - 5)
    }

    // ── Main loop ─────────────────────────────────────────────
    let rafId = 0

    function loop() {
      if (gameOver) return

      const now = performance.now()
      const dt  = Math.min(now - lastT, 50)
      lastT = now

      // Timer
      const elapsed = (Date.now() - matchStartTime) / 1000
      if (elapsed >= MATCH_SECS) {
        const winner: 1 | 2 = !p2Body || p1Body.position.x >= p2Body.position.x ? 1 : 2
        gameOver = true
        trackEvent('match_finished', { winner, reason: 'timer', time: elapsed })
        onVictoryRef.current(winner, elapsed)
        return
      }

      Matter.Engine.update(engine, dt)

      const p1g = p1Gnd.size > 0
      const p2g = p2Gnd.size > 0

      // Player input
      move(p1Body, 'KeyA', 'KeyD', ['KeyW', 'Space'], p1g, p1JC)
      if (p2Body) move(p2Body, 'ArrowLeft', 'ArrowRight', ['ArrowUp'], p2g, p2JC)

      // Checkpoints
      p1CP = checkCPs(p1Body, p1CP, 1)
      if (p2Body) p2CP = checkCPs(p2Body, p2CP, 2)

      // Deaths
      if (p1Body.position.y > DEATH_Y) respawn(p1Body, p1CP, 1, p1Gnd)
      if (p2Body && p2Body.position.y > DEATH_Y) respawn(p2Body, p2CP, 2, p2Gnd)

      // Finish detection
      const atFinish = (b: Matter.Body) =>
        Math.abs(b.position.x - ROOFTOP_TEST.finishX) < 75 &&
        b.position.y < ROOFTOP_TEST.finishY + 90

      if (atFinish(p1Body)) {
        gameOver = true
        trackEvent('match_finished', { winner: 1, reason: 'finish', time: elapsed })
        onVictoryRef.current(1, elapsed)
        return
      }
      if (p2Body && atFinish(p2Body)) {
        gameOver = true
        trackEvent('match_finished', { winner: 2, reason: 'finish', time: elapsed })
        onVictoryRef.current(2, elapsed)
        return
      }

      // Camera — follow leading player
      const leadBody = p2Body && p2Body.position.x > p1Body.position.x ? p2Body : p1Body
      const tCamX = leadBody.position.x - CANVAS_W * 0.38
      const tCamY = leadBody.position.y - CANVAS_H * 0.52
      camX += (tCamX - camX) * 0.09
      camY += (tCamY - camY) * 0.09
      camX = Math.max(0, Math.min(camX, ROOFTOP_TEST.width  - CANVAS_W))
      camY = Math.max(-60, Math.min(camY, ROOFTOP_TEST.height - CANVAS_H + 100))

      // Snapshot keys for next-frame edge detection
      prevKeys.clear()
      keys.forEach((k) => prevKeys.add(k))

      // ── Render ─────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      drawBg()
      ctx.save()
      ctx.translate(-Math.round(camX), -Math.round(camY))
      drawMap()
      if (p2Body && player2) drawPlayer(p2Body, player2, 'P2')
      drawPlayer(p1Body, player1, 'P1')
      ctx.restore()

      rafId = requestAnimationFrame(loop)
    }

    trackEvent('match_started', { p1: player1.id, p2: player2?.id ?? null, map: 'rooftop-test' })
    rafId = requestAnimationFrame(loop)

    return () => {
      gameOver = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      Matter.World.clear(world, false)
      Matter.Engine.clear(engine)
    }
  }, [player1, player2, matchStartTime]) // onVictory accessed via ref

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block w-full h-full bg-black"
    />
  )
}

/**
 * Character PNG renderer.
 * Visual-only layer — collision box stays at 32×50 in GameCanvas.
 * Feet of the PNG align to the bottom of the physics body.
 */

// ── Visual sizes per character (PNG render dimensions) ───────────
export const CHAR_SIZES: Record<string, { w: number; h: number }> = {
  commander: { w: 90,  h: 140 },
  bj:        { w: 88,  h: 118 },
  brae:      { w: 85,  h: 112 },
  xanny:     { w: 82,  h: 104 },
  zaya:      { w: 78,  h: 100 },
}
const DEFAULT_SIZE = { w: 80, h: 110 }

// Physics box half-height — feet align to this offset from body center
const PHYS_HALF_H = 25

// ── Image cache — loaded once, shared across renders ─────────────
const _imgCache = new Map<string, HTMLImageElement>()

export function loadCharacterImage(characterId: string): HTMLImageElement {
  if (_imgCache.has(characterId)) return _imgCache.get(characterId)!
  const img = new Image()
  img.src = `/game-assets/characters/${characterId}/${characterId}-full.png`
  _imgCache.set(characterId, img)
  return img
}

export function getCharacterImage(characterId: string): HTMLImageElement | null {
  return _imgCache.get(characterId) ?? null
}

// ── Draw state ────────────────────────────────────────────────────
export interface CharDrawState {
  x:            number   // body center x
  y:            number   // body center y
  vx:           number
  vy:           number
  grounded:     boolean
  facing:       'left' | 'right'
  anim:         number   // frame counter (increment each game tick)
  landSquashT:  number   // ms timestamp of last landing, 0 = none
  characterId:  string
  color:        string
  name:         string
  effectType:   string | null  // 'freeze' | 'slow' | 'slip' | null
  effectEndsAt: number
  now:          number
}

// ── Main draw function ────────────────────────────────────────────
export function drawCharacter(ctx: CanvasRenderingContext2D, s: CharDrawState): void {
  const size   = CHAR_SIZES[s.characterId] ?? DEFAULT_SIZE
  const footY  = s.y + PHYS_HALF_H      // bottom of physics box = foot line
  const age    = s.now - s.landSquashT   // ms since last landing

  // ── Drop shadow ──────────────────────────────────────────────
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle   = '#000'
  ctx.beginPath()
  ctx.ellipse(s.x, footY + 3, size.w * 0.28, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Behind-character aura ────────────────────────────────────
  drawAura(ctx, s, footY, size)

  // ── Compute animation transforms ─────────────────────────────
  const moving  = Math.abs(s.vx) > 0.5
  const bounce  = (s.grounded && moving) ? Math.sin(s.anim * 0.25) * 3 : 0
  const lean    = s.vx * 0.04    // radians — forward tilt while running

  let scaleX = 1, scaleY = 1

  if (!s.grounded) {
    // Jump stretch — taller + narrower proportional to upward velocity
    const stretch = Math.min(0.09, Math.abs(s.vy) * 0.004)
    scaleY = 1 + stretch
    scaleX = 1 - stretch * 0.55
  }

  if (s.landSquashT > 0 && age < 120) {
    // Landing squash — recover over 120ms
    const t = 1 - age / 120
    scaleY = 1 - 0.09 * t
    scaleX = 1 + 0.07 * t
  }

  // ── Effect tint ──────────────────────────────────────────────
  const frozen = s.effectType === 'bear_trap'    && s.effectEndsAt > s.now
  const slowed = s.effectType === 'slime_puddle' && s.effectEndsAt > s.now
  const tintColor = frozen ? '#60a5fa' : slowed ? '#22c55e' : ''
  const tintAlpha = frozen ? 0.45      : slowed ? 0.35      : 0

  // ── Draw sprite ──────────────────────────────────────────────
  ctx.save()
  ctx.translate(s.x, footY + bounce)
  ctx.rotate(lean)
  ctx.scale(s.facing === 'left' ? -1 : 1, 1)
  ctx.scale(scaleX, scaleY)
  ctx.translate(-size.w / 2, -size.h)   // pivot: feet center

  const img = getCharacterImage(s.characterId)
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, size.w, size.h)
    if (tintAlpha > 0) {
      ctx.globalAlpha = tintAlpha
      ctx.fillStyle   = tintColor
      ctx.fillRect(0, 0, size.w, size.h)
    }
  } else {
    // Color fallback until image loads
    ctx.globalAlpha = 0.85
    ctx.fillStyle   = s.color
    ctx.roundRect?.(0, 0, size.w, size.h, 8) ?? ctx.fillRect(0, 0, size.w, size.h)
    ctx.fill()
  }

  ctx.restore()

  // ── Freeze ice cracks ────────────────────────────────────────
  if (frozen) {
    ctx.save()
    ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x + Math.cos(i * 1.57) * 22, s.y + Math.sin(i * 1.57) * 28)
      ctx.stroke()
    }
    ctx.restore()
  }

  // ── Name tag ─────────────────────────────────────────────────
  const nameY = footY - size.h + bounce - 8
  ctx.save()
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const tw = ctx.measureText(s.name).width + 14
  // Drop shadow for crispness
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur  = 4
  ctx.fillStyle   = 'rgba(0,0,0,0.82)'
  ctx.roundRect?.(s.x - tw / 2, nameY - 16, tw, 15, 4)
  ctx.fill()
  ctx.shadowBlur  = 0
  ctx.fillStyle   = s.color
  ctx.fillText(s.name, s.x, nameY)
  ctx.restore()
}

// ── Remote ghost (online) ─────────────────────────────────────────
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  color: string,
  name: string,
  x: number,
  y: number,
  facing: number,  // -1 = left, 1 = right
): void {
  const size  = CHAR_SIZES[characterId] ?? DEFAULT_SIZE
  const footY = y + PHYS_HALF_H

  const img = getCharacterImage(characterId)

  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.translate(x, footY)
  ctx.scale(facing < 0 ? -1 : 1, 1)
  ctx.translate(-size.w / 2, -size.h)

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, size.w, size.h)
  } else {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, size.w, size.h)
  }

  ctx.restore()

  // Ghost name tag
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  const nameY = footY - size.h - 5
  const tw    = ctx.measureText(name).width + 10
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - tw / 2, nameY - 14, tw, 13)
  ctx.fillStyle = color; ctx.fillText(name, x, nameY)
  ctx.restore()
}

// ── Character-specific auras drawn behind the sprite ─────────────
function drawAura(
  ctx: CanvasRenderingContext2D,
  s: CharDrawState,
  footY: number,
  size: { w: number; h: number },
): void {
  const midY = footY - size.h * 0.5

  if (s.characterId === 'commander') {
    // Gold command pulse rings
    const p1 = 0.5 + 0.5 * Math.sin(s.now * 0.003)
    const p2 = 0.5 + 0.5 * Math.sin(s.now * 0.003 + 1.2)
    ctx.save()
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
    ctx.globalAlpha = 0.16 * p1
    ctx.beginPath(); ctx.arc(s.x, midY, 50 + p1 * 8, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 0.10 * p2
    ctx.beginPath(); ctx.arc(s.x, midY, 34 + p2 * 5, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()

  } else if (s.characterId === 'bj') {
    // Red chaos glow
    const pulse = 0.5 + 0.5 * Math.sin(s.now * 0.005)
    ctx.save()
    ctx.globalAlpha = 0.12 * pulse
    const grd = ctx.createRadialGradient(s.x, midY, 0, s.x, midY, 45)
    grd.addColorStop(0, '#ef4444'); grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd
    ctx.fillRect(s.x - 45, midY - 45, 90, 90)
    ctx.restore()

  } else if (s.characterId === 'brae') {
    // Purple trick energy
    const pulse = 0.4 + 0.6 * Math.sin(s.now * 0.004 + 0.8)
    ctx.save()
    ctx.globalAlpha = 0.13 * pulse
    const grd = ctx.createRadialGradient(s.x, midY, 0, s.x, midY, 42)
    grd.addColorStop(0, '#8b5cf6'); grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd
    ctx.fillRect(s.x - 42, midY - 42, 84, 84)
    ctx.restore()

  } else if (s.characterId === 'xanny') {
    // Blue speed trail — only when running fast
    const spd = Math.abs(s.vx)
    if (spd > 2) {
      const dir    = s.vx > 0 ? -1 : 1
      const trails = Math.min(4, Math.floor(spd / 2))
      ctx.save()
      for (let i = 1; i <= trails; i++) {
        const tx = s.x + dir * i * 16
        ctx.globalAlpha = (0.28 - i * 0.06) * Math.min(1, spd / 9)
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth   = 2.5 - i * 0.4
        ctx.beginPath()
        ctx.moveTo(tx, footY - 20)
        ctx.lineTo(tx, footY - size.h + 20)
        ctx.stroke()
      }
      ctx.restore()
    }
  }
}

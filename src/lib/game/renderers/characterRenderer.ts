/**
 * Character PNG renderer.
 * Visual-only layer — collision box stays at 32×50 in GameCanvas.
 * Feet of the PNG align to the bottom of the physics body.
 *
 * Asset path priority:
 *   1. /game-assets/characters-gameplay/{id}/{id}-full.png  (foot-aligned, tight crop)
 *   2. /game-assets/characters-normalized/{id}/{id}-full.png (fallback)
 *
 * IMPORTANT: Card assets (-card.png) must NEVER be used here.
 * If a card path is detected, a warning is logged and the full asset is used.
 */

// Characters that have a gameplay-optimized asset
const GAMEPLAY_ASSET_IDS = new Set(['commander', 'bj', 'brae', 'xanny'])

// ── Visual sizes matched to actual image aspect ratios ───────────
// Sized so character occupies ~20-24% of the 540px canvas height.
// w/h ratios match the foot-aligned gameplay image dimensions.
export const CHAR_SIZES: Record<string, { w: number; h: number }> = {
  commander: { w: 96,  h: 125 },  // 500×650 source → 0.769 ratio
  bj:        { w: 100, h: 116 },  // 500×579 source → 0.863 ratio
  brae:      { w: 104, h: 108 },  // 500×519 source → 0.963 ratio
  xanny:     { w: 108, h: 101 },  // 500×469 source → 1.066 ratio
  zaya:      { w: 80,  h: 100 },  // no gameplay asset yet
  governor:  { w: 90,  h: 115 },  // no gameplay asset yet
}
const DEFAULT_SIZE = { w: 88, h: 110 }

// Physics box half-height — feet align to this offset from body center
const PHYS_HALF_H = 25

// ── Image cache — loaded once, shared across renders ─────────────
const _imgCache = new Map<string, HTMLImageElement>()

export function loadCharacterImage(characterId: string): HTMLImageElement {
  if (_imgCache.has(characterId)) return _imgCache.get(characterId)!

  // Card asset guard — should never reach gameplay
  if (characterId.includes('-card')) {
    console.warn(`[CharacterRenderer] Gameplay renderer received card asset for "${characterId}". Falling back to full asset.`)
  }

  const useGameplay = GAMEPLAY_ASSET_IDS.has(characterId)
  const src = useGameplay
    ? `/game-assets/characters-gameplay/${characterId}/${characterId}-full.png`
    : `/game-assets/characters-normalized/${characterId}/${characterId}-full.png`

  const img = new Image()
  img.src = src

  // Fallback: if gameplay asset fails to load, try normalized
  if (useGameplay) {
    img.onerror = () => {
      console.warn(`[CharacterRenderer] Gameplay asset not found for "${characterId}", falling back to normalized.`)
      const fallback = new Image()
      fallback.src = `/game-assets/characters-normalized/${characterId}/${characterId}-full.png`
      _imgCache.set(characterId, fallback)
    }
  }

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
  effectType:   string | null
  effectEndsAt: number
  now:          number
}

// ── Rounded rect helper — avoids ctx.roundRect?. stale-path bug ──
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
  ctx.fill()
}

// ── Main draw function ────────────────────────────────────────────
export function drawCharacter(ctx: CanvasRenderingContext2D, s: CharDrawState): void {
  const size   = CHAR_SIZES[s.characterId] ?? DEFAULT_SIZE
  const footY  = s.y + PHYS_HALF_H      // bottom of physics box = foot line
  const age    = s.now - s.landSquashT   // ms since last landing

  // ── Colored ground glow — under feet only, always behind sprite ──
  // Radial gradient ellipse at ground level so character pops on dark
  // backgrounds without using CSS filters (which amplify the PNG border).
  ctx.save()
  const grd = ctx.createRadialGradient(s.x, footY, 0, s.x, footY, size.w * 0.55)
  grd.addColorStop(0, s.color)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = 0.32
  ctx.fillStyle   = grd
  ctx.beginPath()
  ctx.ellipse(s.x, footY, size.w * 0.55, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Dark shadow disc — subtly under feet, NOT over body ──────────
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle   = 'rgba(0,0,0,1)'
  ctx.beginPath()
  ctx.ellipse(s.x, footY + 2, size.w * 0.22, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Behind-character aura ────────────────────────────────────────
  // IMPORTANT: drawAura ends with ctx.arc/ctx.stroke paths in context.
  // We do NOT call ctx.fill() after this — handled inside drawAura with
  // its own save/restore.
  drawAura(ctx, s, footY, size)

  // ── Compute animation transforms ─────────────────────────────────
  const moving = Math.abs(s.vx) > 0.5
  const bounce = (s.grounded && moving) ? Math.sin(s.anim * 0.25) * 3 : 0
  const lean   = s.vx * 0.04

  let scaleX = 1, scaleY = 1

  if (!s.grounded) {
    const stretch = Math.min(0.09, Math.abs(s.vy) * 0.004)
    scaleY = 1 + stretch
    scaleX = 1 - stretch * 0.55
  }

  if (s.landSquashT > 0 && age < 120) {
    const t = 1 - age / 120
    scaleY = 1 - 0.09 * t
    scaleX = 1 + 0.07 * t
  }

  // ── Effect tint ──────────────────────────────────────────────────
  const frozen    = s.effectType === 'bear_trap'    && s.effectEndsAt > s.now
  const slowed    = s.effectType === 'slime_puddle' && s.effectEndsAt > s.now
  const tintColor = frozen ? '#60a5fa' : slowed ? '#22c55e' : ''
  const tintAlpha = frozen ? 0.45      : slowed ? 0.35      : 0

  // ── Draw sprite ──────────────────────────────────────────────────
  // No CSS drop-shadow filter — it highlights the PNG's black border
  // on dark backgrounds, making bordered images look like black boxes.
  // Visibility comes from the colored ground glow drawn above.
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
    // Colored rounded-rect fallback while image loads.
    // Uses fillRoundRect helper to avoid roundRect? stale-path bug.
    ctx.globalAlpha = 0.85
    ctx.fillStyle   = s.color
    fillRoundRect(ctx, 0, 0, size.w, size.h, 8)
  }

  ctx.restore()

  // ── Freeze ice cracks (drawn after sprite) ───────────────────────
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

  // ── Name tag — above character head ─────────────────────────────
  // Uses fillRoundRect helper; NEVER calls ctx.fill() on a stale path.
  const nameY = footY - size.h + bounce - 8
  ctx.save()
  ctx.font          = 'bold 11px sans-serif'
  ctx.textAlign     = 'center'
  ctx.textBaseline  = 'bottom'
  const tw          = ctx.measureText(s.name).width + 14
  ctx.fillStyle     = 'rgba(0,0,0,0.78)'
  fillRoundRect(ctx, s.x - tw / 2, nameY - 16, tw, 15, 4)
  ctx.fillStyle     = s.color
  ctx.shadowColor   = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur    = 3
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
// Every branch uses save/restore and explicit beginPath so no path
// leaks into the caller.
function drawAura(
  ctx: CanvasRenderingContext2D,
  s: CharDrawState,
  footY: number,
  size: { w: number; h: number },
): void {
  const midY = footY - size.h * 0.5

  if (s.characterId === 'commander') {
    // Gold command pulse rings (stroke only — no fill, no path leak)
    const p1 = 0.5 + 0.5 * Math.sin(s.now * 0.003)
    const p2 = 0.5 + 0.5 * Math.sin(s.now * 0.003 + 1.2)
    ctx.save()
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
    ctx.globalAlpha = 0.18 * p1
    ctx.beginPath(); ctx.arc(s.x, midY, 50 + p1 * 8, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 0.12 * p2
    ctx.beginPath(); ctx.arc(s.x, midY, 34 + p2 * 5, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()

  } else if (s.characterId === 'bj') {
    const pulse = 0.5 + 0.5 * Math.sin(s.now * 0.005)
    ctx.save()
    ctx.globalAlpha = 0.12 * pulse
    const grd = ctx.createRadialGradient(s.x, midY, 0, s.x, midY, 45)
    grd.addColorStop(0, '#ef4444'); grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd
    ctx.fillRect(s.x - 45, midY - 45, 90, 90)
    ctx.restore()

  } else if (s.characterId === 'brae') {
    const pulse = 0.4 + 0.6 * Math.sin(s.now * 0.004 + 0.8)
    ctx.save()
    ctx.globalAlpha = 0.13 * pulse
    const grd = ctx.createRadialGradient(s.x, midY, 0, s.x, midY, 42)
    grd.addColorStop(0, '#8b5cf6'); grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd
    ctx.fillRect(s.x - 42, midY - 42, 84, 84)
    ctx.restore()

  } else if (s.characterId === 'xanny') {
    // Speed trail — only when running fast
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

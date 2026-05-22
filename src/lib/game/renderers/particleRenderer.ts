/**
 * Character-specific continuous particle emission.
 * Returns Particle[] to be merged into the main particle array in GameCanvas.
 */
import type { Particle } from '@/lib/game/effects/Particles'

function spark(
  x: number, y: number,
  color: string,
  count: number,
  speed = 2,
  life = 0.35,
  sizeRange: [number, number] = [1.5, 3.5],
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const spd   = speed * (0.5 + Math.random() * 0.8)
    const l     = life * (0.7 + Math.random() * 0.6)
    return {
      x, y,
      vx:      Math.cos(angle) * spd,
      vy:      Math.sin(angle) * spd - 1,
      life:    l,
      maxLife: l,
      color,
      size:    sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    }
  })
}

interface EmitInput {
  characterId: string
  x:           number
  y:           number
  footY:       number
  vx:          number
  vy:          number
  grounded:    boolean
  anim:        number   // frame counter
}

/**
 * Called each game tick. Returns particles to push onto the main array.
 * Emitters are throttled by checking `anim % N` so they don't flood the pool.
 */
export function emitCharacterParticles(s: EmitInput): Particle[] {
  const out: Particle[] = []
  const { characterId, x, y, footY, vx, vy, grounded, anim } = s

  if (characterId === 'xanny') {
    // Blue speed dust when sprinting on ground
    if (grounded && Math.abs(vx) > 4 && anim % 3 === 0) {
      const dir = vx > 0 ? -1 : 1
      out.push(...spark(x + dir * 12, footY, '#60a5fa', 2, 2, 0.3, [1, 2.5]))
      out.push(...spark(x + dir * 22, footY, '#93c5fd', 1, 1.5, 0.22, [1, 2]))
    }
    // Airborne lightning sparks
    if (!grounded && Math.abs(vx) > 3 && anim % 6 === 0) {
      out.push(...spark(x, y, '#60a5fa', 2, 2.5, 0.4, [1.5, 3]))
    }

  } else if (characterId === 'commander') {
    // Gold command aura — subtle ambient sparks while moving
    if (Math.abs(vx) > 1 && anim % 8 === 0) {
      out.push(...spark(x, y - 20, '#fbbf24', 1, 1.2, 0.55, [1.5, 3]))
    }
    // Landing impact pulse
    if (!grounded && Math.abs(vy) > 6 && anim % 4 === 0) {
      out.push(...spark(x, y, '#f59e0b', 1, 2, 0.4, [1, 2.5]))
    }

  } else if (characterId === 'bj') {
    // Red chaos sparks while moving
    if (Math.abs(vx) > 2 && anim % 7 === 0) {
      out.push(...spark(x, y, '#ef4444', 1, 2, 0.35, [1, 2.5]))
    }
    // Chaos burst when jumping
    if (!grounded && vy < -4 && anim % 5 === 0) {
      out.push(...spark(x, footY, '#dc2626', 2, 3, 0.4, [1.5, 3]))
    }

  } else if (characterId === 'brae') {
    // Purple trick energy — glitchy sparks when moving
    if (Math.abs(vx) > 1.5 && anim % 9 === 0) {
      out.push(...spark(x, y - 10, '#8b5cf6', 1, 1.8, 0.45, [1.5, 3]))
    }
    // Mid-air flip energy
    if (!grounded && anim % 6 === 0) {
      out.push(...spark(x, y, '#a78bfa', 1, 2.5, 0.4, [1, 2.5]))
    }

  } else if (characterId === 'zaya') {
    // Pink sparkle trail
    if (anim % 5 === 0) {
      out.push(...spark(x, y + (grounded ? 0 : -10), '#ec4899', 1, 2, 0.5, [1.5, 3]))
    }
    // Light bounce particles when grounded + moving
    if (grounded && Math.abs(vx) > 0.5 && anim % 4 === 0) {
      out.push(...spark(x, footY, '#f9a8d4', 1, 1.5, 0.3, [1, 2]))
    }
  }

  return out
}

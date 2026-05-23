export type AnimPose =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'dash'
  | 'hit'
  | 'trap'
  | 'victory'

export interface CharacterAnimationState {
  pose:         AnimPose
  runCycle:     number   // 0–2π, driven by anim frame counter
  landSquash:   number   // 0–1, decays after landing
  lean:         number   // radians, forward tilt from velocity
  scaleX:       number
  scaleY:       number
  facing:       1 | -1   // 1 = right, -1 = left
  speed:        number   // |vx|
  isAirborne:   boolean
  isFrozen:     boolean
  isSlowed:     boolean
  hasPowerup:   boolean
}

interface PhysicsSnapshot {
  vx:           number
  vy:           number
  grounded:     boolean
  facing:       'left' | 'right'
  anim:         number   // frame counter
  landSquashT:  number   // timestamp of last landing (ms), 0 = none
  now:          number   // current timestamp (ms)
  effectType:   string | null
  effectEndsAt: number
}

export function deriveAnimState(p: PhysicsSnapshot): CharacterAnimationState {
  const speed    = Math.abs(p.vx)
  const facing   = p.facing === 'right' ? 1 : -1
  const runCycle = p.anim * 0.22  // ~1.4 Hz at 60fps

  const age         = p.now - p.landSquashT
  const landSquash  = (p.landSquashT > 0 && age < 160) ? 1 - age / 160 : 0

  const isFrozen  = p.effectType === 'bear_trap'    && p.effectEndsAt > p.now
  const isSlowed  = p.effectType === 'slime_puddle' && p.effectEndsAt > p.now

  let scaleX = 1, scaleY = 1
  if (!p.grounded) {
    const stretch = Math.min(0.10, Math.abs(p.vy) * 0.004)
    scaleY = p.vy < 0 ? 1 + stretch : 1 + stretch * 0.5
    scaleX = 1 - stretch * 0.5
  }
  if (landSquash > 0) {
    scaleY = 1 - 0.12 * landSquash
    scaleX = 1 + 0.09 * landSquash
  }

  const lean = p.vx * 0.038

  let pose: AnimPose
  if (isFrozen)          pose = 'hit'
  else if (!p.grounded && p.vy < -2)  pose = 'jump'
  else if (!p.grounded)               pose = 'fall'
  else if (landSquash > 0.5)          pose = 'land'
  else if (speed > 0.5)               pose = 'run'
  else                                pose = 'idle'

  return { pose, runCycle, landSquash, lean, scaleX, scaleY, facing, speed, isAirborne: !p.grounded, isFrozen, isSlowed, hasPowerup: false }
}

import type { CharacterId } from '@/types/player'

export type TrapId = 'banana_peel' | 'slime_puddle' | 'giant_fan' | 'fake_block' | 'bear_trap'

export interface TrapDef {
  id:            TrapId
  displayName:   string
  icon:          string   // emoji
  cooldown:      number   // seconds between activations
  duration:      number   // seconds effect lasts on target
  effectType:    'slip' | 'slow' | 'push' | 'visual' | 'freeze'
  description:   string
  color:         string
  hitW:          number   // hitbox width
  hitH:          number   // hitbox height
  placeOffsetX:  number   // how far ahead (px) to place from owner
}

export const TRAP_REGISTRY: Record<TrapId, TrapDef> = {
  banana_peel: {
    id:           'banana_peel',
    displayName:  'Banana Peel',
    icon:         '🍌',
    cooldown:     8,
    duration:     1.6,
    effectType:   'slip',
    description:  'Lose control and slide randomly.',
    color:        '#fbbf24',
    hitW:         40, hitH: 20,
    placeOffsetX: 60,
  },
  slime_puddle: {
    id:           'slime_puddle',
    displayName:  'Slime Puddle',
    icon:         '🟢',
    cooldown:     10,
    duration:     3,
    effectType:   'slow',
    description:  'Reduces movement speed to 40%.',
    color:        '#22c55e',
    hitW:         72, hitH: 18,
    placeOffsetX: 50,
  },
  giant_fan: {
    id:           'giant_fan',
    displayName:  'Giant Fan',
    icon:         '💨',
    cooldown:     12,
    duration:     2,
    effectType:   'push',
    description:  'Blasts player backward.',
    color:        '#60a5fa',
    hitW:         80, hitH: 120,
    placeOffsetX: 90,
  },
  fake_block: {
    id:           'fake_block',
    displayName:  'Fake Block',
    icon:         '🎭',
    cooldown:     9,
    duration:     4,   // how long the fake visual lasts
    effectType:   'visual',
    description:  'Fake platform that vanishes on contact.',
    color:        '#a78bfa',
    hitW:         120, hitH: 14,
    placeOffsetX: 80,
  },
  bear_trap: {
    id:           'bear_trap',
    displayName:  'Bear Trap',
    icon:         '🪤',
    cooldown:     14,
    duration:     2,
    effectType:   'freeze',
    description:  'Snap! Player is frozen in place.',
    color:        '#f87171',
    hitW:         36, hitH: 28,
    placeOffsetX: 55,
  },
}

// Character-to-trap assignment
export const CHAR_TRAP: Record<CharacterId, TrapId> = {
  commander: 'giant_fan',
  bj:        'bear_trap',
  brae:      'fake_block',
  xanny:     'banana_peel',
  zaya:      'slime_puddle',
}

export const TRAP_LIST: TrapDef[] = Object.values(TRAP_REGISTRY)

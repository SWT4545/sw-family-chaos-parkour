export type PowerupId = 'speed_shoes' | 'rocket_shoes' | 'super_jump' | 'double_jump' | 'chaos_blind'

export interface PowerupDef {
  id:          PowerupId
  displayName: string
  icon:        string   // emoji
  duration:    number   // seconds (0 = instant-use)
  color:       string
  description: string
}

export const POWERUP_REGISTRY: Record<PowerupId, PowerupDef> = {
  speed_shoes: {
    id: 'speed_shoes', displayName: 'Speed Shoes', icon: '👟',
    duration: 6, color: '#f59e0b',
    description: '+50% movement speed.',
  },
  rocket_shoes: {
    id: 'rocket_shoes', displayName: 'Rocket Shoes', icon: '🚀',
    duration: 8, color: '#ef4444',
    description: '+40% jump power.',
  },
  super_jump: {
    id: 'super_jump', displayName: 'Super Jump', icon: '⬆️',
    duration: 0, color: '#10b981',
    description: 'Instant massive jump.',
  },
  double_jump: {
    id: 'double_jump', displayName: 'Double Jump', icon: '✌️',
    duration: 10, color: '#8b5cf6',
    description: 'One extra jump allowed.',
  },
  chaos_blind: {
    id: 'chaos_blind', displayName: 'Chaos Blind', icon: '👁️',
    duration: 4, color: '#6b7280',
    description: 'Screen strobes — everyone suffers.',
  },
}

// Fixed spawn locations on ROOFTOP_TEST map (above platforms, reachable)
export const POWERUP_SPAWNS: Array<{ x: number; y: number }> = [
  { x: 190,  y: 600 },  // start area — above ground platform (y=640)
  { x: 1965, y: 400 },  // mid-map — above platform at (1875, y=434)
  { x: 3532, y: 295 },  // near CP3 — above platform at (3445, y=338)
]

// Respawn delay in ms after a powerup is collected
export const POWERUP_RESPAWN_MS = 20_000

export const POWERUP_LIST: PowerupDef[] = Object.values(POWERUP_REGISTRY)
export const POWERUP_IDS = Object.keys(POWERUP_REGISTRY) as PowerupId[]

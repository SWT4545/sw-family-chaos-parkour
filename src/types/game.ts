export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type?: string
}

export interface CheckpointDef {
  id?: number
  x: number
  y: number
}

export interface CoinPosition {
  x: number
  y: number
}

export interface SoloHazardDef {
  trapId?: string  // TrapId value — string to avoid circular dep
  type?: string    // generic type field for course hazards
  x: number
  y: number
}

export interface MapDef {
  id?: string
  name?: string
  background?: string
  width: number
  height: number
  startPositions: Array<{ x: number; y: number }>
  finishX: number
  finishY: number
  platforms: Platform[]
  checkpoints: CheckpointDef[]
  coinPositions?:    CoinPosition[]
  moneyBagPositions?: CoinPosition[]  // value = 10 coins each
  soloHazards?:      SoloHazardDef[]
}

export interface LevelDef {
  id: string
  name: string
  subtitle: string
  difficulty: 'easy' | 'easy+' | 'medium' | 'medium+' | 'hard' | 'expert' | 'chaos'
  difficultyNum: number  // 1-7
  description: string
  unlockReward: string   // what this level unlocks
  map: MapDef
}

// ── Course Progression System ──────────────────────────────────────────────

export type CourseDifficulty = 'easy' | 'medium' | 'hard' | 'master'

export interface DifficultyConfig {
  label: string
  color: string
  trapFrequencyMult: number    // 0.5 = half traps, 2.0 = double
  coinMultiplier: number       // coins awarded multiplier
  checkpointCount: number      // how many checkpoints to show
  tacoRainChance: number       // 0–1 probability
  powerupSpawnMult: number     // powerup frequency
  badge?: string               // badge awarded for master completion
}

export const DIFFICULTY_CONFIGS: Record<CourseDifficulty, DifficultyConfig> = {
  easy:   { label: 'Easy',   color: '#22c55e', trapFrequencyMult: 0.5, coinMultiplier: 1,   checkpointCount: 3, tacoRainChance: 0.05, powerupSpawnMult: 1.5 },
  medium: { label: 'Medium', color: '#fbbf24', trapFrequencyMult: 1.0, coinMultiplier: 1.5, checkpointCount: 2, tacoRainChance: 0.1,  powerupSpawnMult: 1.0 },
  hard:   { label: 'Hard',   color: '#f97316', trapFrequencyMult: 1.5, coinMultiplier: 2.0, checkpointCount: 1, tacoRainChance: 0.2,  powerupSpawnMult: 0.75 },
  master: { label: 'Master', color: '#ef4444', trapFrequencyMult: 2.0, coinMultiplier: 3.0, checkpointCount: 0, tacoRainChance: 0.4,  powerupSpawnMult: 0.5, badge: 'master-runner' },
}

export interface CourseDef {
  id: string
  courseNumber: number        // 1–5
  name: string
  subtitle: string
  theme: string
  description: string
  map: MapDef
}

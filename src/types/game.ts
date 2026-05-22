export interface Platform {
  x: number
  y: number
  width: number
  height: number
}

export interface CheckpointDef {
  id: number
  x: number
  y: number
}

export interface CoinPosition {
  x: number
  y: number
}

export interface SoloHazardDef {
  trapId: string   // TrapId value — string to avoid circular dep
  x: number
  y: number
}

export interface MapDef {
  width: number
  height: number
  startPositions: Array<{ x: number; y: number }>
  finishX: number
  finishY: number
  platforms: Platform[]
  checkpoints: CheckpointDef[]
  coinPositions?: CoinPosition[]
  soloHazards?:  SoloHazardDef[]
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

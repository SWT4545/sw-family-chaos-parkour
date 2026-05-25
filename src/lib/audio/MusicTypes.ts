export type MusicSlot =
  | 'hub' | 'menu' | 'characterSelect' | 'worldSelect' | 'lobby'
  | 'race' | 'victory' | 'boss' | 'shop' | 'leaderboard' | 'launchpad'
  | 'familyCity' | 'chaosLabs' | 'volcano' | 'japanNeon'
  | 'spaceStation' | 'dreamChaos'

export type MusicMood = 'chill' | 'hype' | 'intense' | 'mysterious' | 'victory' | 'boss'

export interface MusicTrackDef {
  id:           string
  title:        string
  artistSource: string         // 'Suno' | 'Built-in'
  slot:         MusicSlot
  gameId?:      string
  worldId?:     string
  scene?:       string
  localPath?:   string         // /public path fallback
  storagePath?: string         // Firebase Storage path
  downloadUrl?: string         // resolved at runtime
  loop:         boolean
  volume:       number
  bpm?:         number
  mood:         MusicMood
  energyLevel:  number         // 1-10
  isActive:     boolean
  createdAt?:   number
  updatedAt?:   number
}

export type AdaptiveLayer = 'base' | 'danger' | 'speed' | 'boss' | 'victory'

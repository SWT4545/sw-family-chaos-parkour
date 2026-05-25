import type { MapDef } from '@/types/game'

export type WorldDifficulty = 'starter' | 'normal' | 'hard' | 'expert' | 'chaos'

export type MechanicTag =
  | 'basic' | 'checkpoints' | 'coins' | 'traps'
  | 'moving_platforms' | 'conveyors' | 'gravity_pads' | 'trap_overload'
  | 'collapsing_platforms' | 'lava_rise' | 'falling_rocks' | 'heat_vents'
  | 'bounce_pads' | 'teleport_gates' | 'timed_platforms' | 'rail_grind'
  | 'gravity_zones' | 'air_boost' | 'asteroid_hazards' | 'floating_platforms'
  | 'fake_platforms' | 'gravity_flip' | 'time_slow' | 'visual_distortion'
  | 'character_shortcuts' | 'boss_chase' | 'speed_storm'

export type WorldTheme =
  | 'family_city' | 'chaos_labs' | 'volcano' | 'japan_neon'
  | 'space_station' | 'dream_chaos'

export interface WorldLevelDef {
  id:            string
  worldId:       string
  levelNumber:   number       // 1-6 within world (6 = boss)
  isBoss:        boolean
  title:         string
  subtitle:      string
  difficulty:    WorldDifficulty
  description:   string
  mechanics:     MechanicTag[]
  musicSlot:     string
  parTimeMs:     number
  threeStarMs:   number
  completionReward: {
    coins:       number
    xp:          number
    unlocks?:    string[]     // characterId, worldId, cosmeticId
  }
  map:           MapDef
  comingSoon?:   boolean
  nextLevelId?:  string       // next level in the campaign chain (same or next world)
  nextWorldId?:  string       // world unlocked by completing this level (boss levels)
}

export interface WorldDef {
  id:            string
  name:          string
  subtitle:      string
  theme:         WorldTheme
  description:   string
  color:         string      // primary color
  accentColor:   string
  icon:          string      // emoji
  bgImage?:      string      // /public path
  levels:        WorldLevelDef[]
  mechanics:     MechanicTag[]
  unlockReq?:    string      // worldId that must be completed first
}

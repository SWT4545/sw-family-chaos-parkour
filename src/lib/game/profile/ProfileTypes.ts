export type CharacterUnlockId = 'commander' | 'bj' | 'brae' | 'xanny' | 'zaya' | 'governor'

export type AchievementId =
  | 'first_win' | 'first_solo' | 'collector_100' | 'collector_500' | 'collector_1000'
  | 'speed_demon' | 'world1_complete' | 'world2_complete' | 'world3_complete'
  | 'chaos_master' | 'no_trap_run' | 'zaya_unlock' | 'all_chars' | 'shop_first_buy'

export interface EquippedCosmetics {
  trail:       string
  border:      string
  emote:       string
  victoryPose: string
  badge:       string | null
  musicTrack:  string | null
  nameplate:   string | null
}

export interface WorldProgress {
  worldId:          string
  levelsCompleted:  string[]   // level IDs
  bossDefeated:     boolean
  bestTimes:        Record<string, number>  // levelId -> ms
  starsEarned:      Record<string, number>  // levelId -> 0-3
}

export interface PlayerProfile {
  // Identity
  playerId:        string
  displayName:     string
  createdAt:       number
  updatedAt:       number

  // Economy
  coins:           number
  totalCoinsEarned: number

  // XP / Level
  xp:              number
  level:           number

  // Match stats
  wins:            number
  losses:          number
  soloRunsCompleted: number
  multiplayerWins:   number

  // Characters
  selectedCharacterId: string
  unlockedCharacters:  string[]

  // Worlds / courses
  unlockedWorlds:    string[]
  completedWorlds:   string[]
  unlockedCourses:   string[]
  completedLevels:   string[]
  firstCompletions:  string[]   // tracks one-time bonus per level+difficulty
  worldProgress:     Record<string, WorldProgress>

  // Best times per course (seconds)
  bestTimesByCourse: Record<string, number>

  // Campaign progress
  unlockedLevels:         string[]                    // explicitly unlocked level IDs
  starsByLevel:           Record<string, 0|1|2|3>     // stars earned per level
  currentCampaignLevelId?: string                     // for "Continue Campaign"

  // Cosmetics
  ownedCosmetics:    string[]
  equippedCosmetics: EquippedCosmetics
  ownedMusicTracks:  string[]

  // Achievements
  achievements:      string[]
}

// ── XP thresholds ──────────────────────────────────────────────────────────
export const XP_PER_LEVEL = 200
export function xpToLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1)
}
export function xpForNextLevel(xp: number): number {
  const currentLevel = xpToLevel(xp)
  return currentLevel * XP_PER_LEVEL - xp
}

// ── Coin economy constants ──────────────────────────────────────────────────
export const COIN_REWARDS = {
  completion: {
    easy:    25,
    'easy+': 35,
    medium:  40,
    'medium+': 55,
    hard:    60,
    expert:  90,
    chaos:   125,
  } as Record<string, number>,
  bonuses: {
    perfectRun:       25,
    allCoinsCollected: 50,
    newBestTime:       35,
    firstCompletion:   75,
  },
  coinPickupValue: 1,
} as const

export const XP_REWARDS = {
  soloComplete:  50,
  matchWin:      80,
  matchLoss:     25,
  dailyChallenge: 100,
  newBestTime:   40,
  firstClear:    150,
} as const

export const DEFAULT_EQUIPPED: EquippedCosmetics = {
  trail:       'trail_default',
  border:      'border_default',
  emote:       'emote_gg',
  victoryPose: 'pose_default',
  badge:       null,
  musicTrack:  null,
  nameplate:   null,
}

export function defaultProfile(playerId: string, displayName: string, characterId = 'commander'): PlayerProfile {
  const now = Date.now()
  return {
    playerId,
    displayName,
    createdAt:   now,
    updatedAt:   now,
    coins:             0,
    totalCoinsEarned:  0,
    xp:                0,
    level:             1,
    wins:              0,
    losses:            0,
    soloRunsCompleted: 0,
    multiplayerWins:   0,
    selectedCharacterId: characterId,
    unlockedCharacters:  ['commander'],
    unlockedWorlds:      ['family-city'],
    completedWorlds:     [],
    unlockedCourses:     ['rooftop-run'],
    completedLevels:     [],
    firstCompletions:    [],
    worldProgress:       {},
    bestTimesByCourse:   {},
    unlockedLevels:      ['family-city-training-grounds'],
    starsByLevel:        {},
    ownedCosmetics:      ['trail_default', 'border_default', 'pose_default', 'emote_gg'],
    equippedCosmetics:   { ...DEFAULT_EQUIPPED },
    ownedMusicTracks:    [],
    achievements:        [],
  }
}

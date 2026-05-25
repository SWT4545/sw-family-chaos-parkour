export type LeaderboardCategory =
  | 'solo-time'  // ascending (lower = better)
  | 'wins'       // descending
  | 'coins'      // descending
  | 'daily'      // descending, resets daily
  | 'weekly'     // descending, resets weekly

export interface LeaderboardEntry {
  entryId:        string    // `${category}_${playerId}`
  playerId:       string
  displayName:    string
  characterId:    string
  score:          number
  category:       LeaderboardCategory
  courseId?:      string
  difficulty?:    string
  timeMs?:        number
  coinsCollected?: number
  createdAt:      number
  updatedAt:      number
}

export interface LeaderboardPage {
  category:  LeaderboardCategory
  entries:   LeaderboardEntry[]
  source:    'firebase' | 'local'
  fetchedAt: number
}

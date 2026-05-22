export interface SeasonConfig {
  id:         string   // 'season-1'
  name:       string   // 'Season 1: Family Chaos Launch'
  startDate:  number   // ms timestamp
  endDate:    number
  levels:     number   // 30
  xpPerLevel: number   // 100
}

export interface SeasonProfile {
  seasonId:            string
  seasonXP:            number
  seasonLevel:         number
  matchesPlayed:       number
  wins:                number
  coinsEarned:         number
  claimedLevelRewards: number[]  // array of claimed level numbers
}

export interface SeasonReward {
  level:      number
  cosmeticId: string
  label:      string
}

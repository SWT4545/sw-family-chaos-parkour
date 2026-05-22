export interface LocalProfile {
  id:                  string
  playerName:          string
  selectedCharacterId: string
  totalCoins:          number
  wins:                number
  losses:              number
  soloRuns:            number
  bestSoloTime:        number | null   // seconds; null = never finished
  favoriteCharacter:   string | null
  unlockedTrails:      string[]
  unlockedEmotes:      string[]
  unlockedOutfits:     string[]
  createdAt:           number          // ms timestamp
  lastUpdated:         number
}

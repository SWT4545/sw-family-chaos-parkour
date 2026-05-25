export interface ScoreBreakdown {
  basePoints:       number
  coinPoints:       number
  timeBonus:        number
  noDeathBonus:     number
  allCoinsBonus:    number
  newBestTimeBonus: number
  deathPenalty:     number
  trapHitPenalty:   number
  difficultyMult:   number
  finalScore:       number
}

export interface ScoreParams {
  difficulty:         string
  finishTimeMs:       number
  parTimeMs:          number
  coinsCollected:     number
  totalCoins:         number
  deaths:             number
  trapHits:           number
  isBestTime:         boolean
}

export const DIFFICULTY_MULT: Record<string, number> = {
  starter: 1.0,
  normal:  1.0,
  hard:    1.35,
  expert:  1.6,
  chaos:   2.0,
}

export const BASE_POINTS: Record<string, number> = {
  starter: 800,
  normal:  1000,
  hard:    1500,
  expert:  2200,
  chaos:   3500,
}

import type { ScoreBreakdown, ScoreParams } from './ScoreTypes'
import { DIFFICULTY_MULT, BASE_POINTS } from './ScoreTypes'

export const ScoreService = {
  calculate(params: ScoreParams): ScoreBreakdown {
    const {
      difficulty, finishTimeMs, parTimeMs,
      coinsCollected, totalCoins, deaths, trapHits, isBestTime,
    } = params

    const diffMult = DIFFICULTY_MULT[difficulty] ?? 1.0

    const basePoints       = BASE_POINTS[difficulty] ?? 1000
    const coinPoints       = coinsCollected * 100
    const timeBonus        = Math.max(0, Math.floor((parTimeMs - finishTimeMs) / 100))
    const noDeathBonus     = deaths === 0 ? 500 : 0
    const allCoinsBonus    = totalCoins > 0 && coinsCollected >= totalCoins ? 750 : 0
    const newBestTimeBonus = isBestTime ? 350 : 0
    const deathPenalty     = deaths * 250
    const trapHitPenalty   = trapHits * 75

    const rawScore = (
      basePoints + coinPoints + timeBonus +
      noDeathBonus + allCoinsBonus + newBestTimeBonus -
      deathPenalty - trapHitPenalty
    )

    const finalScore = Math.max(0, Math.round(rawScore * diffMult))

    return {
      basePoints,
      coinPoints,
      timeBonus,
      noDeathBonus,
      allCoinsBonus,
      newBestTimeBonus,
      deathPenalty,
      trapHitPenalty,
      difficultyMult: diffMult,
      finalScore,
    }
  },
}

/**
 * Firebase leaderboard stubs.
 * Returns empty arrays when Firebase env vars are missing.
 * Phase 7 will wire up real Firestore queries.
 */

export interface LeaderboardEntry {
  rank:        number
  playerId:    string
  playerName:  string
  characterId: string
  value:       number   // time, wins, or coins depending on board
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  )
}

export async function submitLeaderboardScore(
  _board: 'solo-times' | 'most-wins' | 'most-coins',
  _entry: Omit<LeaderboardEntry, 'rank'>,
): Promise<void> {
  if (!isConfigured()) return
  // TODO Phase 7: write to Firestore leaderboard collection
}

export async function getLeaderboard(
  _board: 'solo-times' | 'most-wins' | 'most-coins',
  _limit = 10,
): Promise<LeaderboardEntry[]> {
  if (!isConfigured()) return []
  // TODO Phase 7: query Firestore leaderboard collection
  return []
}

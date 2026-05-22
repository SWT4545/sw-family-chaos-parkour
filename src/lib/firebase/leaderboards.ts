import { collection, doc, setDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { getDb } from './firebaseConfig'

const COLL = 'swfcp_leaderboard'

export interface LeaderboardEntry {
  playerId:    string
  playerName:  string
  characterId: string
  score:       number
  category:    'solo-time' | 'wins' | 'coins'
  updatedAt:   number
}

export async function submitLeaderboardScore(entry: LeaderboardEntry): Promise<void> {
  const db = getDb()
  if (!db) return
  try { await setDoc(doc(db, COLL, `${entry.category}_${entry.playerId}`), entry) } catch {}
}

export async function getLeaderboard(
  category: LeaderboardEntry['category'],
  maxEntries = 20,
): Promise<LeaderboardEntry[]> {
  const db = getDb()
  if (!db) return []
  try {
    const asc = category === 'solo-time'
    const q   = query(
      collection(db, COLL),
      where('category', '==', category),
      orderBy('score', asc ? 'asc' : 'desc'),
      limit(maxEntries),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as LeaderboardEntry)
  } catch { return [] }
}

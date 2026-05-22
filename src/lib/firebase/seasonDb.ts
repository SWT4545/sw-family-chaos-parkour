import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb } from './firebaseConfig'
import type { SeasonProfile } from '@/types/season'

const COLL = 'swfcp_seasons'

function docId(playerId: string, seasonId: string) { return `${playerId}_${seasonId}` }

export async function saveSeasonProfile(
  playerId: string,
  profile: SeasonProfile,
): Promise<void> {
  const db = getDb()
  if (!db) return
  try { await setDoc(doc(db, COLL, docId(playerId, profile.seasonId)), profile) } catch {}
}

export async function fetchSeasonProfile(
  playerId: string,
  seasonId: string,
): Promise<SeasonProfile | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLL, docId(playerId, seasonId)))
    return snap.exists() ? (snap.data() as SeasonProfile) : null
  } catch { return null }
}

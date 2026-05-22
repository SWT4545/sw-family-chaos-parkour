import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getDb } from './firebaseConfig'
import type { LocalProfile } from '@/types/profile'

const COLL = 'swfcp_players'

export async function savePlayerProfile(profile: LocalProfile): Promise<void> {
  const db = getDb()
  if (!db) return
  try { await setDoc(doc(db, COLL, profile.id), profile) } catch {}
}

export async function getPlayerProfile(id: string): Promise<LocalProfile | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLL, id))
    return snap.exists() ? (snap.data() as LocalProfile) : null
  } catch { return null }
}

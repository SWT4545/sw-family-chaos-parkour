/**
 * Firebase player profile stubs.
 * Functions are safe no-ops when Firebase env vars are missing.
 * Phase 7 will wire up real Firebase Auth + Firestore.
 */

import type { LocalProfile } from '@/types/profile'

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  )
}

export async function savePlayerProfile(_profile: LocalProfile): Promise<void> {
  if (!isConfigured()) return
  // TODO Phase 7: await setDoc(doc(db, 'players', profile.id), profile)
}

export async function getPlayerProfile(_id: string): Promise<LocalProfile | null> {
  if (!isConfigured()) return null
  // TODO Phase 7: const snap = await getDoc(doc(db, 'players', id)); return snap.data() ?? null
  return null
}

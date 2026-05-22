import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb } from './firebaseConfig'
import type { CosmeticInventory } from '@/types/cosmetics'

const COLL = 'swfcp_inventories'

export async function saveCosmeticInventory(
  playerId: string,
  inventory: CosmeticInventory,
): Promise<void> {
  const db = getDb()
  if (!db) return
  try { await setDoc(doc(db, COLL, playerId), inventory) } catch {}
}

export async function fetchCosmeticInventory(
  playerId: string,
): Promise<CosmeticInventory | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLL, playerId))
    return snap.exists() ? (snap.data() as CosmeticInventory) : null
  } catch { return null }
}

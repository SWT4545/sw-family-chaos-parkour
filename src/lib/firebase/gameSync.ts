import { ref, set, onValue, off } from 'firebase/database'
import { getRtdb } from './firebaseConfig'

export interface PlayerSyncState {
  x:          number
  y:          number
  vx:         number
  vy:         number
  facing:     number   // 1 = right, -1 = left
  state:      'run' | 'jump' | 'trapped' | 'idle'
  coins:      number
  checkpoint: number
  ts:         number
}

export async function publishPlayerState(
  roomCode: string,
  playerId: string,
  state: PlayerSyncState,
): Promise<void> {
  const db = getRtdb()
  if (!db) return
  try { await set(ref(db, `games/${roomCode}/players/${playerId}`), state) } catch {}
}

export function subscribeToRoomSync(
  roomCode: string,
  localPlayerId: string,
  onUpdate: (playerId: string, state: PlayerSyncState) => void,
): () => void {
  const db = getRtdb()
  if (!db) return () => {}

  const r = ref(db, `games/${roomCode}/players`)
  onValue(r, (snap) => {
    const data = snap.val()
    if (!data) return
    for (const [pid, state] of Object.entries(data)) {
      if (pid !== localPlayerId) onUpdate(pid, state as PlayerSyncState)
    }
  })
  return () => off(r)
}

export async function cleanupGameSync(roomCode: string, playerId: string): Promise<void> {
  const db = getRtdb()
  if (!db) return
  try { await set(ref(db, `games/${roomCode}/players/${playerId}`), null) } catch {}
}

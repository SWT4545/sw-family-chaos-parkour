import { ref, set, get, update, remove, onValue, off } from 'firebase/database'
import { getRtdb } from './firebaseConfig'
import type { Room, RoomPlayer, RoomStatus } from '@/types/room'

const ROOT = 'swfcp_rooms'
const TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase request timed out')), ms)
    ),
  ])
}

function roomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createRoom(params: {
  hostId:      string
  hostName:    string
  characterId: string
  mapId:       string
}): Promise<string | null> {
  const db = getRtdb()
  if (!db) return null

  // Pick a code that isn't already in use
  let code = roomCode()
  for (let i = 0; i < 5; i++) {
    const snap = await withTimeout(get(ref(db, `${ROOT}/${code}/data`)))
    if (!snap.exists()) break
    code = roomCode()
  }

  const room: Room = {
    code, hostId: params.hostId, status: 'waiting',
    mapId: params.mapId, mode: 'family', maxPlayers: 4,
    createdAt: Date.now(),
  }
  const player: RoomPlayer = {
    id: params.hostId, displayName: params.hostName,
    characterId: params.characterId, ready: false,
    isHost: true, connected: true, joinedAt: Date.now(),
  }

  await withTimeout(set(ref(db, `${ROOT}/${code}/data`), room))
  await withTimeout(set(ref(db, `${ROOT}/${code}/players/${params.hostId}`), player))
  return code
}

export async function joinRoom(params: {
  code:        string
  playerId:    string
  playerName:  string
  characterId: string
}): Promise<{ success: boolean; error?: string }> {
  const db = getRtdb()
  if (!db) return { success: false, error: 'Firebase not configured' }

  const snap = await withTimeout(get(ref(db, `${ROOT}/${params.code}/data`)))
  if (!snap.exists()) return { success: false, error: 'Room not found' }

  const room = snap.val() as Room
  if (room.status !== 'waiting') return { success: false, error: 'Game already started' }

  const player: RoomPlayer = {
    id: params.playerId, displayName: params.playerName,
    characterId: params.characterId, ready: false,
    isHost: false, connected: true, joinedAt: Date.now(),
  }
  await withTimeout(set(ref(db, `${ROOT}/${params.code}/players/${params.playerId}`), player))
  return { success: true }
}

export function subscribeToRoom(
  code: string,
  onRoom: (room: Room | null) => void,
  onPlayers: (players: RoomPlayer[]) => void,
): () => void {
  const db = getRtdb()
  if (!db) return () => {}

  const roomRef    = ref(db, `${ROOT}/${code}/data`)
  const playersRef = ref(db, `${ROOT}/${code}/players`)

  onValue(roomRef, (s) => onRoom(s.exists() ? (s.val() as Room) : null))
  onValue(playersRef, (s) => {
    const val = s.val()
    onPlayers(val ? Object.values(val) as RoomPlayer[] : [])
  })

  return () => { off(roomRef); off(playersRef) }
}

export async function setPlayerReady(code: string, playerId: string, ready: boolean): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(update(ref(db, `${ROOT}/${code}/players/${playerId}`), { ready }))
}

export async function setRoomStatus(code: string, status: RoomStatus): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(update(ref(db, `${ROOT}/${code}/data`), { status }))
}

export async function setRoomMap(code: string, mapId: string): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(update(ref(db, `${ROOT}/${code}/data`), { mapId }))
}

export async function kickPlayer(code: string, playerId: string): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(remove(ref(db, `${ROOT}/${code}/players/${playerId}`)))
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(remove(ref(db, `${ROOT}/${code}/players/${playerId}`)))
}

export async function updatePlayerCharacter(
  code: string, playerId: string, characterId: string,
): Promise<void> {
  const db = getRtdb()
  if (!db) return
  await withTimeout(update(ref(db, `${ROOT}/${code}/players/${playerId}`), { characterId, ready: false }))
}

import {
  collection, doc, setDoc, getDoc, updateDoc,
  onSnapshot, deleteDoc,
} from 'firebase/firestore'
import { getDb } from './firebaseConfig'
import type { Room, RoomPlayer, RoomStatus } from '@/types/room'

const COLL        = 'swfcp_rooms'
const TIMEOUT_MS  = 6_000

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
  const db = getDb()
  if (!db) return null

  let code = roomCode()
  for (let i = 0; i < 5; i++) {
    const snap = await withTimeout(getDoc(doc(db, COLL, code)))
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

  await withTimeout(setDoc(doc(db, COLL, code), room))
  await withTimeout(setDoc(doc(db, COLL, code, 'players', params.hostId), player))
  return code
}

export async function joinRoom(params: {
  code:        string
  playerId:    string
  playerName:  string
  characterId: string
}): Promise<{ success: boolean; error?: string }> {
  const db = getDb()
  if (!db) return { success: false, error: 'Firebase not configured' }

  const snap = await withTimeout(getDoc(doc(db, COLL, params.code)))
  if (!snap.exists()) return { success: false, error: 'Room not found' }

  const room = snap.data() as Room
  if (room.status !== 'waiting') return { success: false, error: 'Game already started' }

  const player: RoomPlayer = {
    id: params.playerId, displayName: params.playerName,
    characterId: params.characterId, ready: false,
    isHost: false, connected: true, joinedAt: Date.now(),
  }
  await withTimeout(setDoc(doc(db, COLL, params.code, 'players', params.playerId), player))
  return { success: true }
}

export function subscribeToRoom(
  code: string,
  onRoom: (room: Room | null) => void,
  onPlayers: (players: RoomPlayer[]) => void,
): () => void {
  const db = getDb()
  if (!db) return () => {}

  const unsubRoom = onSnapshot(doc(db, COLL, code), (s) =>
    onRoom(s.exists() ? (s.data() as Room) : null))

  const unsubPlayers = onSnapshot(collection(db, COLL, code, 'players'), (s) =>
    onPlayers(s.docs.map(d => d.data() as RoomPlayer)))

  return () => { unsubRoom(); unsubPlayers() }
}

export async function setPlayerReady(code: string, playerId: string, ready: boolean): Promise<void> {
  const db = getDb()
  if (!db) return
  await updateDoc(doc(db, COLL, code, 'players', playerId), { ready })
}

export async function setRoomStatus(code: string, status: RoomStatus): Promise<void> {
  const db = getDb()
  if (!db) return
  await updateDoc(doc(db, COLL, code), { status })
}

export async function setRoomMap(code: string, mapId: string): Promise<void> {
  const db = getDb()
  if (!db) return
  await updateDoc(doc(db, COLL, code), { mapId })
}

export async function kickPlayer(code: string, playerId: string): Promise<void> {
  const db = getDb()
  if (!db) return
  await deleteDoc(doc(db, COLL, code, 'players', playerId))
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const db = getDb()
  if (!db) return
  await deleteDoc(doc(db, COLL, code, 'players', playerId))
}

export async function updatePlayerCharacter(
  code: string, playerId: string, characterId: string,
): Promise<void> {
  const db = getDb()
  if (!db) return
  await updateDoc(doc(db, COLL, code, 'players', playerId), { characterId, ready: false })
}

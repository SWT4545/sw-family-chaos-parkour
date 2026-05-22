'use client'
import { useEffect, useRef, useState } from 'react'
import { subscribeToRoomSync, cleanupGameSync, publishPlayerState } from '@/lib/firebase/gameSync'
import type { PlayerSyncState } from '@/lib/firebase/gameSync'
import type { Character } from '@/types/player'
import type { RoomPlayer } from '@/types/room'

export interface RemoteGhost {
  playerId:  string
  character: Character
  name:      string
  state:     PlayerSyncState
}

export function useGameSync(
  roomCode: string | null,
  localPlayerId: string | null,
  remotePlayers: RoomPlayer[],
  characterMap: Map<string, Character>,
) {
  const [remoteGhosts, setRemoteGhosts] = useState<RemoteGhost[]>([])
  const remoteStatesRef = useRef<Map<string, PlayerSyncState>>(new Map())
  const pendingStateRef = useRef<PlayerSyncState | null>(null)
  const remotePlayersRef = useRef(remotePlayers)
  const characterMapRef  = useRef(characterMap)
  useEffect(() => { remotePlayersRef.current = remotePlayers }, [remotePlayers])
  useEffect(() => { characterMapRef.current  = characterMap },  [characterMap])

  // Subscribe to remote players' positions
  useEffect(() => {
    if (!roomCode || !localPlayerId) return
    const unsub = subscribeToRoomSync(roomCode, localPlayerId, (pid, state) => {
      remoteStatesRef.current.set(pid, state)
      const ghosts: RemoteGhost[] = []
      for (const [pid2, st] of remoteStatesRef.current.entries()) {
        const rp   = remotePlayersRef.current.find(p => p.id === pid2)
        const char = rp ? characterMapRef.current.get(rp.characterId) : undefined
        if (rp && char) ghosts.push({ playerId: pid2, character: char, name: rp.displayName, state: st })
      }
      setRemoteGhosts(ghosts)
    })
    return () => {
      unsub()
      if (roomCode && localPlayerId) cleanupGameSync(roomCode, localPlayerId)
    }
  }, [roomCode, localPlayerId])

  // Flush pending state to Firebase every 150 ms
  useEffect(() => {
    if (!roomCode || !localPlayerId) return
    const interval = setInterval(() => {
      if (pendingStateRef.current) {
        publishPlayerState(roomCode, localPlayerId, pendingStateRef.current)
      }
    }, 150)
    return () => clearInterval(interval)
  }, [roomCode, localPlayerId])

  // Called from GameCanvas each tick; batched above
  function publishState(state: PlayerSyncState) {
    pendingStateRef.current = state
  }

  // Called immediately (e.g. on finish line crossing) — bypasses the 150ms batch
  function publishStateNow(state: PlayerSyncState) {
    if (roomCode && localPlayerId) publishPlayerState(roomCode, localPlayerId, state)
    pendingStateRef.current = null  // clear pending so the next batch doesn't overwrite
  }

  return { remoteGhosts, publishState, publishStateNow }
}

'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  subscribeToRoom, setPlayerReady, leaveRoom,
  setRoomStatus, kickPlayer, setRoomMap,
} from '@/lib/firebase/rooms'
import type { Room, RoomPlayer } from '@/types/room'

export function useOnlineRoom(code: string | null, localPlayerId: string | null) {
  const [room,    setRoom]    = useState<Room | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [loading, setLoading] = useState(true)
  // Prevents leaveRoom from firing when the lobby unmounts due to game start
  const skipLeaveRef = useRef(false)

  useEffect(() => {
    if (!code || !localPlayerId) { setLoading(false); return }
    setLoading(true)
    skipLeaveRef.current = false
    const unsub = subscribeToRoom(
      code,
      (r) => { setRoom(r); setLoading(false) },
      (ps) => setPlayers(ps),
    )
    return () => {
      unsub()
      if (!skipLeaveRef.current) leaveRoom(code, localPlayerId)
    }
  }, [code, localPlayerId])

  const toggleReady = useCallback(async () => {
    if (!code || !localPlayerId) return
    const me = players.find(p => p.id === localPlayerId)
    if (me) await setPlayerReady(code, localPlayerId, !me.ready)
  }, [code, localPlayerId, players])

  const startMatch = useCallback(async () => {
    if (!code) return
    skipLeaveRef.current = true   // game is starting — don't leave on unmount
    await setRoomStatus(code, 'starting')
  }, [code])

  const leave = useCallback(async () => {
    if (!code || !localPlayerId) return
    skipLeaveRef.current = true   // we'll call leaveRoom manually right now
    await leaveRoom(code, localPlayerId)
  }, [code, localPlayerId])

  const kick = useCallback(async (playerId: string) => {
    if (!code) return
    await kickPlayer(code, playerId)
  }, [code])

  const changeMap = useCallback(async (mapId: string) => {
    if (!code) return
    await setRoomMap(code, mapId)
  }, [code])

  const me      = players.find(p => p.id === localPlayerId)
  const allReady = players.length >= 2 && players.filter(p => !p.isHost).every(p => p.ready)

  return { room, players, loading, me, allReady, toggleReady, startMatch, leave, kick, changeMap }
}

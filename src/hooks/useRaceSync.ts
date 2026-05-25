'use client'
import { useEffect, useRef, useState } from 'react'
import { subscribeToAllPlayers, cleanupGameSync, publishPlayerState } from '@/lib/firebase/gameSync'
import { setRoomResults } from '@/lib/firebase/rooms'
import type { PlayerSyncState } from '@/lib/firebase/gameSync'
import type { Character } from '@/types/player'
import type { RoomPlayer, RaceResult } from '@/types/room'
import type { RemoteGhost } from '@/hooks/useGameSync'

export interface RaceProgressEntry {
  playerId: string
  name:     string
  color:    string
  pct:      number     // 0–100
  finished: boolean
}

interface UseRaceSyncParams {
  roomCode:         string | null
  localPlayerId:    string | null
  allPlayers:       RoomPlayer[]
  characterMap:     Map<string, Character>
  isHost:           boolean
  finishX:          number
  countdownStartAt: number
}

interface FinishRecord {
  name:        string
  characterId: string
  finishedAt:  number
  coins:       number
}

export function useRaceSync({
  roomCode,
  localPlayerId,
  allPlayers,
  characterMap,
  isHost,
  finishX,
  countdownStartAt,
}: UseRaceSyncParams) {
  const [remoteGhosts,  setRemoteGhosts]  = useState<RemoteGhost[]>([])
  const [raceProgress,  setRaceProgress]  = useState<RaceProgressEntry[]>([])

  const allStatesRef      = useRef<Map<string, PlayerSyncState>>(new Map())
  const pendingStateRef   = useRef<PlayerSyncState | null>(null)
  const allPlayersRef     = useRef(allPlayers)
  const characterMapRef   = useRef(characterMap)
  const finishXRef        = useRef(finishX)
  const isHostRef         = useRef(isHost)
  const countdownRef      = useRef(countdownStartAt)
  const resultsWrittenRef = useRef(false)
  const finishMapRef      = useRef<Map<string, FinishRecord>>(new Map())

  useEffect(() => { allPlayersRef.current = allPlayers },     [allPlayers])
  useEffect(() => { characterMapRef.current = characterMap }, [characterMap])
  useEffect(() => { finishXRef.current = finishX },           [finishX])
  useEffect(() => { isHostRef.current = isHost },             [isHost])
  useEffect(() => { countdownRef.current = countdownStartAt }, [countdownStartAt])

  function rebuildProgress(states: Map<string, PlayerSyncState>) {
    const fx = finishXRef.current || 4200
    const entries: RaceProgressEntry[] = []

    for (const player of allPlayersRef.current) {
      const state = states.get(player.id)
      const char  = characterMapRef.current.get(player.characterId)
      const color = char?.color ?? '#888'
      const pct   = state
        ? state.finished
          ? 100
          : Math.min(99, Math.round(state.x / fx * 100))
        : 0
      entries.push({
        playerId: player.id,
        name:     player.displayName,
        color,
        pct,
        finished: state?.finished ?? false,
      })
    }

    // Sort: highest pct first (leader first)
    entries.sort((a, b) => b.pct - a.pct)
    return entries
  }

  function rebuildGhosts(states: Map<string, PlayerSyncState>) {
    const ghosts: RemoteGhost[] = []
    for (const [pid, st] of states.entries()) {
      if (pid === localPlayerId) continue
      const rp   = allPlayersRef.current.find(p => p.id === pid)
      const char = rp ? characterMapRef.current.get(rp.characterId) : undefined
      if (rp && char) ghosts.push({ playerId: pid, character: char, name: rp.displayName, state: st })
    }
    return ghosts
  }

  function maybeWriteResults(states: Map<string, PlayerSyncState>) {
    if (!isHostRef.current) return
    if (resultsWrittenRef.current) return
    if (!roomCode) return

    const players = allPlayersRef.current
    if (players.length === 0) return

    // Check if all players have finished
    const allFinished = players.every(p => states.get(p.id)?.finished === true)
    if (!allFinished) return

    resultsWrittenRef.current = true
    const goTime = countdownRef.current + 3000

    // Build results from finish map + states
    const results: Omit<RaceResult, 'place'>[] = players.map(player => {
      const finishRecord = finishMapRef.current.get(player.id)
      const state = states.get(player.id)
      const finishedAt = finishRecord?.finishedAt ?? state?.finishedAt
      const coins      = finishRecord?.coins ?? state?.coins ?? 0
      const dnf        = !finishedAt
      const finishTimeMs = finishedAt ? finishedAt - goTime : -1
      return {
        playerId:    player.id,
        displayName: player.displayName,
        characterId: player.characterId,
        finishTimeMs,
        coins,
        dnf,
      }
    })

    // Sort: finished first (by time), then DNF
    results.sort((a, b) => {
      if (a.dnf && b.dnf) return 0
      if (a.dnf) return 1
      if (b.dnf) return -1
      return a.finishTimeMs - b.finishTimeMs
    })

    const finalResults: RaceResult[] = results.map((r, i) => ({ ...r, place: i + 1 }))
    setRoomResults(roomCode, finalResults).catch(() => {})
  }

  // 90-second DNF timeout from GO moment
  useEffect(() => {
    if (!roomCode || !localPlayerId || !isHost) return
    if (countdownStartAt === 0) return

    const goTime = countdownStartAt + 3000
    const timeoutMs = goTime + 90_000 - Date.now()
    if (timeoutMs <= 0) return

    const timer = setTimeout(() => {
      if (resultsWrittenRef.current) return
      resultsWrittenRef.current = true

      const players = allPlayersRef.current
      const states  = allStatesRef.current
      const goT     = countdownRef.current + 3000

      const results: Omit<RaceResult, 'place'>[] = players.map(player => {
        const state = states.get(player.id)
        const finishRecord = finishMapRef.current.get(player.id)
        const finishedAt = finishRecord?.finishedAt ?? state?.finishedAt
        const coins      = finishRecord?.coins ?? state?.coins ?? 0
        const dnf        = !finishedAt || !state?.finished
        const finishTimeMs = finishedAt && state?.finished ? finishedAt - goT : -1
        return {
          playerId:    player.id,
          displayName: player.displayName,
          characterId: player.characterId,
          finishTimeMs,
          coins,
          dnf,
        }
      })

      results.sort((a, b) => {
        if (a.dnf && b.dnf) return 0
        if (a.dnf) return 1
        if (b.dnf) return -1
        return a.finishTimeMs - b.finishTimeMs
      })

      const finalResults: RaceResult[] = results.map((r, i) => ({ ...r, place: i + 1 }))
      setRoomResults(roomCode, finalResults).catch(() => {})
    }, timeoutMs)

    return () => clearTimeout(timer)
  }, [roomCode, localPlayerId, isHost, countdownStartAt])

  // Subscribe to all players
  useEffect(() => {
    if (!roomCode || !localPlayerId) return
    resultsWrittenRef.current = false

    const unsub = subscribeToAllPlayers(roomCode, (statesObj) => {
      for (const [pid, state] of Object.entries(statesObj)) {
        allStatesRef.current.set(pid, state)
        // Track finish records for host result computation
        if (state.finished && state.finishedAt && !finishMapRef.current.has(pid)) {
          const player = allPlayersRef.current.find(p => p.id === pid)
          if (player) {
            finishMapRef.current.set(pid, {
              name:        player.displayName,
              characterId: player.characterId,
              finishedAt:  state.finishedAt,
              coins:       state.coins,
            })
          }
        }
      }

      const ghosts   = rebuildGhosts(allStatesRef.current)
      const progress = rebuildProgress(allStatesRef.current)
      setRemoteGhosts(ghosts)
      setRaceProgress(progress)
      maybeWriteResults(allStatesRef.current)
    })

    return () => {
      unsub()
      if (roomCode && localPlayerId) cleanupGameSync(roomCode, localPlayerId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, localPlayerId])

  // Flush pending state every 150ms
  useEffect(() => {
    if (!roomCode || !localPlayerId) return
    const interval = setInterval(() => {
      if (pendingStateRef.current) {
        publishPlayerState(roomCode, localPlayerId, pendingStateRef.current)
      }
    }, 150)
    return () => clearInterval(interval)
  }, [roomCode, localPlayerId])

  function publishState(state: PlayerSyncState) {
    pendingStateRef.current = state
  }

  function publishStateNow(state: PlayerSyncState) {
    if (roomCode && localPlayerId) publishPlayerState(roomCode, localPlayerId, state)
    pendingStateRef.current = null
  }

  return { remoteGhosts, raceProgress, publishState, publishStateNow }
}

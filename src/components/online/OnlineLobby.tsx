'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Crown, UserX, Wifi, Share2, Check } from 'lucide-react'
import { useOnlineRoom } from '@/hooks/useOnlineRoom'
import { CHARACTERS_LIST } from '@/lib/game/characters/CharacterRegistry'
import { WORLD_REGISTRY } from '@/lib/game/levels/WorldRegistry'
import { setRoomLevel, setRoomCountdown } from '@/lib/firebase/rooms'
import type { RoomPlayer } from '@/types/room'

const DIFFICULTY_COLORS: Record<string, string> = {
  starter: '#6ee7b7',
  normal:  '#60a5fa',
  hard:    '#f97316',
  expert:  '#ef4444',
  chaos:   '#a855f7',
}

interface Props {
  roomCode:            string
  localPlayerId:       string
  onCountdownStarted: (countdownStartAt: number, levelId: string, worldId: string) => void
  onLeave:             () => void
  onPlayersChange:     (players: RoomPlayer[]) => void
}

function PlayerCard({ player, isMe, isLocalHost, onKick }: {
  player: RoomPlayer; isMe: boolean; isLocalHost: boolean; onKick?: () => void
}) {
  const char = CHARACTERS_LIST.find(c => c.id === player.characterId)

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 border"
      style={{
        backgroundColor: 'rgba(10,10,10,0.7)',
        borderColor: isMe ? `${char?.primaryColor ?? '#fbbf24'}40` : 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ backgroundColor: `${char?.primaryColor ?? '#888'}25`, color: char?.primaryColor ?? '#888' }}
      >
        {player.displayName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {player.isHost && <Crown size={11} className="text-yellow-400 flex-shrink-0" />}
          <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
            {player.displayName}{isMe && ' (you)'}
          </p>
        </div>
        <p className="text-[10px]" style={{ color: char?.primaryColor ?? '#555' }}>
          {char?.displayName ?? player.characterId}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {player.isHost ? (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Host
          </span>
        ) : player.ready ? (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            Ready ✓
          </span>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10">
            Waiting...
          </span>
        )}
        {isLocalHost && !player.isHost && !isMe && (
          <button onClick={onKick} className="text-gray-600 hover:text-red-400 transition-colors p-1" aria-label="Kick player">
            <UserX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// All World 1 levels available for race
const RACE_LEVELS = WORLD_REGISTRY[0].levels
const RACE_WORLD  = WORLD_REGISTRY[0]

export function OnlineLobby({ roomCode, localPlayerId, onCountdownStarted, onLeave, onPlayersChange }: Props) {
  const { room, players, loading, me, allReady, toggleReady, leave, kick, skipLeave } =
    useOnlineRoom(roomCode, localPlayerId)

  const [shared,     setShared]     = useState(false)
  const [levelIndex, setLevelIndex] = useState(0)
  const [starting,   setStarting]   = useState(false)
  const countdownFiredRef = useRef(false)

  // Propagate player list to parent
  useEffect(() => { onPlayersChange(players) }, [players, onPlayersChange])

  // Detect room.status becoming 'countdown' — transition for all players
  useEffect(() => {
    if (room?.status === 'countdown' && room.countdownStartAt && room.selectedLevelId && room.selectedWorldId) {
      if (countdownFiredRef.current) return
      countdownFiredRef.current = true
      skipLeave()
      onCountdownStarted(room.countdownStartAt, room.selectedLevelId, room.selectedWorldId)
    }
  }, [room?.status, room?.countdownStartAt, room?.selectedLevelId, room?.selectedWorldId, onCountdownStarted, skipLeave])

  const isHost   = me?.isHost ?? false
  const selLevel = RACE_LEVELS[levelIndex] ?? RACE_LEVELS[0]

  async function handleShare() {
    const text = `Join my Family Chaos Parkour race! Code: ${roomCode}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join my race!', text })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {}
  }

  function handleLevelChange(dir: 1 | -1) {
    const next = (levelIndex + dir + RACE_LEVELS.length) % RACE_LEVELS.length
    setLevelIndex(next)
    const lvl = RACE_LEVELS[next]
    if (roomCode) setRoomLevel(roomCode, RACE_WORLD.id, lvl.id).catch(() => {})
  }

  async function handleStart() {
    if (starting || !allReady) return
    setStarting(true)
    try {
      await setRoomLevel(roomCode, RACE_WORLD.id, selLevel.id)
      await setRoomCountdown(roomCode)
    } catch {
      setStarting(false)
    }
  }

  async function handleLeave() {
    await leave()
    onLeave()
  }

  if (loading) {
    return (
      <div className="h-dvh bg-[#080808] flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Connecting to room...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="h-dvh bg-[#080808] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">Room not found or expired.</p>
        <button onClick={handleLeave} className="text-gray-500 hover:text-white text-xs uppercase tracking-wider">
          ← Back
        </button>
      </div>
    )
  }

  const readyCount = players.filter(p => p.ready || p.isHost).length

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={handleLeave}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors min-h-[44px]"
        >
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Leave</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Wifi size={11} className="text-green-400" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Online Race</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Room code */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-600 font-bold mb-1">Room Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-black tracking-[0.4em] text-white">{roomCode}</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
            aria-label="Share room code"
          >
            {shared ? <Check size={14} className="text-green-400" /> : <Share2 size={14} className="text-gray-400" />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {shared ? 'Copied!' : 'Share'}
            </span>
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1">Share this code with family to join</p>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-3">
        <div className="max-w-lg mx-auto flex flex-col gap-4">

          {/* Players list */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">
              Players ({players.length}/{room.maxPlayers})
            </p>
            <div className="flex flex-col gap-2">
              {players
                .sort((a, b) => (a.isHost ? -1 : b.isHost ? 1 : a.joinedAt - b.joinedAt))
                .map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isMe={p.id === localPlayerId}
                    isLocalHost={isHost}
                    onKick={() => kick(p.id)}
                  />
                ))}
              {Array.from({ length: Math.max(0, room.maxPlayers - players.length) }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed border-gray-800/50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800/30 flex items-center justify-center">
                    <span className="text-gray-700 text-sm">+</span>
                  </div>
                  <p className="text-gray-700 text-xs">Waiting for player...</p>
                </div>
              ))}
            </div>
          </div>

          {/* Level picker — host only */}
          {isHost && (
            <div
              className="rounded-2xl p-4 border border-white/[0.06]"
              style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-3">
                Select Level
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLevelChange(-1)}
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center flex-shrink-0"
                  aria-label="Previous level"
                >
                  <ChevronLeft size={16} />
                </button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selLevel.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 text-center"
                  >
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">
                      {RACE_WORLD.name} · Level {selLevel.levelNumber}
                    </p>
                    <p className="font-black text-white uppercase text-sm leading-tight">{selLevel.title}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{selLevel.subtitle}</p>
                    <span
                      className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${DIFFICULTY_COLORS[selLevel.difficulty] ?? '#888'}20`,
                        color: DIFFICULTY_COLORS[selLevel.difficulty] ?? '#888',
                        border: `1px solid ${DIFFICULTY_COLORS[selLevel.difficulty] ?? '#888'}40`,
                      }}
                    >
                      {selLevel.difficulty}
                    </span>
                  </motion.div>
                </AnimatePresence>
                <button
                  onClick={() => handleLevelChange(1)}
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center flex-shrink-0"
                  aria-label="Next level"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Non-host: show selected level info */}
          {!isHost && room.selectedLevelId && (
            <div
              className="rounded-2xl p-4 border border-white/[0.06] text-center"
              style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Level</p>
              <p className="font-black text-white text-sm uppercase">
                {RACE_LEVELS.find(l => l.id === room.selectedLevelId)?.title ?? room.selectedLevelId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-2">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {isHost ? (
            <motion.button
              onClick={handleStart}
              disabled={!allReady || starting}
              whileHover={allReady && !starting ? { scale: 1.02 } : {}}
              whileTap={allReady && !starting ? { scale: 0.97 } : {}}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest text-black bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed min-h-[56px]"
            >
              {starting
                ? 'Starting...'
                : allReady
                  ? 'START RACE ▶'
                  : `Waiting... (${readyCount}/${players.length} ready)`}
            </motion.button>
          ) : (
            <motion.button
              onClick={toggleReady}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-colors min-h-[56px] ${
                me?.ready
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'text-black bg-yellow-400'
              }`}
            >
              {me?.ready ? 'READY ✓  (tap to un-ready)' : '✓  READY UP'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

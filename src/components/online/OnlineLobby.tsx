'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Check, Crown, Map, UserX, Wifi } from 'lucide-react'
import { useOnlineRoom } from '@/hooks/useOnlineRoom'
import { CHARACTERS_LIST } from '@/lib/game/characters/CharacterRegistry'
import type { RoomPlayer } from '@/types/room'

const MAPS = [
  { id: 'rooftop',   name: 'Rooftop Mayhem',    desc: 'Urban skyline chaos' },
  { id: 'warehouse', name: 'Warehouse Wipeout',  desc: 'Industrial obstacle course' },
  { id: 'park',      name: 'Park Pandemonium',   desc: 'Suburban trap gauntlet' },
]

interface Props {
  roomCode:        string
  localPlayerId:   string
  onMatchStart:    () => void
  onLeave:         () => void
  onPlayersChange: (players: RoomPlayer[]) => void
}

function PlayerRow({ player, isMe, isLocalHost, onKick }: {
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
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
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
        <p className="text-[10px] text-gray-600" style={{ color: char?.primaryColor }}>
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
          <button onClick={onKick} className="text-gray-600 hover:text-red-400 transition-colors p-1">
            <UserX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

export function OnlineLobby({ roomCode, localPlayerId, onMatchStart, onLeave, onPlayersChange }: Props) {
  const { room, players, loading, me, allReady, toggleReady, startMatch, leave, kick, changeMap } =
    useOnlineRoom(roomCode, localPlayerId)
  const [copied,   setCopied]   = useState(false)
  const [mapIndex, setMapIndex] = useState(0)

  // Propagate player list to parent so GameCanvas knows remote characters
  useEffect(() => { onPlayersChange(players) }, [players, onPlayersChange])

  const isHost   = me?.isHost ?? false
  const mapEntry = MAPS[mapIndex]

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStart() {
    await startMatch()   // sets skipLeave = true, then updates room status
    onMatchStart()
  }

  async function handleLeave() {
    await leave()
    onLeave()
  }

  async function handleMapChange(dir: 1 | -1) {
    const next = (mapIndex + dir + MAPS.length) % MAPS.length
    setMapIndex(next)
    await changeMap(MAPS[next].id)
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

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', transform: 'scale(1.05)' }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-2">
        <button onClick={handleLeave} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Leave</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Wifi size={11} className="text-green-400" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Online</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Room code */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-600 font-bold mb-1">Room Code</p>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 group"
        >
          <span className="text-4xl font-black tracking-[0.4em] text-white">{roomCode}</span>
          <span className="text-gray-600 group-hover:text-yellow-400 transition-colors">
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </span>
        </button>
        <p className="text-[10px] text-gray-700 mt-0.5">Share this code with family to join</p>
      </div>

      {/* Players list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-3">
        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">
            Players ({players.length}/{room.maxPlayers})
          </p>
          {players
            .sort((a, b) => (a.isHost ? -1 : b.isHost ? 1 : a.joinedAt - b.joinedAt))
            .map(p => (
              <PlayerRow
                key={p.id}
                player={p}
                isMe={p.id === localPlayerId}
                isLocalHost={isHost}
                onKick={() => kick(p.id)}
              />
            ))}
          {Array.from({ length: Math.max(0, room.maxPlayers - players.length) }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed border-gray-800/50">
              <div className="w-9 h-9 rounded-full bg-gray-800/30 flex items-center justify-center">
                <span className="text-gray-700 text-sm">+</span>
              </div>
              <p className="text-gray-700 text-xs">Waiting for player...</p>
            </div>
          ))}
        </div>

        {/* Map picker — host only */}
        {isHost && (
          <div className="max-w-lg mx-auto mt-4 rounded-2xl p-4 border border-white/[0.06]"
            style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Map size={13} className="text-yellow-500" />
              <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Map</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMapChange(-1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center"
              >
                <ChevronLeft size={14} />
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mapEntry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 text-center"
                >
                  <p className="font-black text-white uppercase text-sm">{mapEntry.name}</p>
                  <p className="text-gray-600 text-[10px]">{mapEntry.desc}</p>
                </motion.div>
              </AnimatePresence>
              <button
                onClick={() => handleMapChange(1)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-2">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {isHost ? (
            <motion.button
              onClick={handleStart}
              disabled={!allReady}
              whileHover={allReady ? { scale: 1.02 } : {}}
              whileTap={allReady ? { scale: 0.97 } : {}}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest text-black bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allReady ? 'START MATCH ▶' : `Waiting for players... (${players.filter(p => p.ready || p.isHost).length}/${players.length} ready)`}
            </motion.button>
          ) : (
            <motion.button
              onClick={toggleReady}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-colors ${
                me?.ready
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'text-black bg-yellow-400'
              }`}
            >
              {me?.ready ? 'READY ✓ (tap to un-ready)' : '✓ READY UP'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { motion } from 'framer-motion'
import { CHARACTERS_LIST } from '@/lib/game/characters/CharacterRegistry'
import type { RaceResult } from '@/types/room'

interface Props {
  results:       RaceResult[]
  localPlayerId: string
  onRaceAgain:   () => void
  onBackToMenu:  () => void
  isHost:        boolean
}

const PLACE_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const PLACE_COINS: Record<number, number> = { 1: 100, 2: 75, 3: 50 }
const PLACE_XP:    Record<number, number> = { 1: 120, 2: 80, 3: 50 }
const DEFAULT_COINS = 25
const DEFAULT_XP    = 30

function formatTime(ms: number): string {
  if (ms < 0) return 'DNF'
  const mins   = Math.floor(ms / 60000)
  const secs   = Math.floor((ms % 60000) / 1000)
  const cents  = Math.floor((ms % 1000) / 10)
  return `${mins}:${String(secs).padStart(2, '0')}.${String(cents).padStart(2, '0')}`
}

function PodiumSlot({ result, height, localPlayerId }: {
  result: RaceResult; height: number; localPlayerId: string
}) {
  const char  = CHARACTERS_LIST.find(c => c.id === result.characterId)
  const color = char?.primaryColor ?? '#888'
  const isMe  = result.playerId === localPlayerId

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Crown / place */}
      <span className="text-xl">{PLACE_EMOJI[result.place] ?? `${result.place}th`}</span>
      {/* Avatar circle */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2"
        style={{
          backgroundColor: `${color}20`,
          color,
          borderColor: isMe ? color : `${color}50`,
          boxShadow: isMe ? `0 0 16px ${color}40` : 'none',
        }}
      >
        {result.displayName.charAt(0).toUpperCase()}
      </div>
      <p className="text-[10px] font-bold text-gray-300 max-w-[60px] text-center truncate">{result.displayName}</p>
      {/* Podium pillar */}
      <div
        className="w-16 rounded-t-lg flex items-end justify-center pb-1"
        style={{
          height,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        <span className="text-[10px] font-black" style={{ color }}>{result.place === 1 ? '1st' : result.place === 2 ? '2nd' : '3rd'}</span>
      </div>
    </div>
  )
}

export function RaceResults({ results, localPlayerId, onRaceAgain, onBackToMenu, isHost }: Props) {
  const sorted = [...results].sort((a, b) => a.place - b.place)
  const top3   = sorted.filter(r => r.place <= 3 && !r.dnf)
  const first  = top3.find(r => r.place === 1)
  const second = top3.find(r => r.place === 2)
  const third  = top3.find(r => r.place === 3)

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{
        background: '#020208',
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 text-center pt-8 pb-4 px-5">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-black uppercase tracking-widest text-white"
        >
          Race Results
        </motion.h1>
        <div className="mt-1 h-0.5 w-16 bg-yellow-400 mx-auto rounded-full" />
      </div>

      {/* Podium */}
      {top3.length >= 1 && (
        <div className="flex-shrink-0 px-5 pb-4">
          <div className="flex items-end justify-center gap-3">
            {/* 2nd place — left */}
            {second ? (
              <PodiumSlot result={second} height={56} localPlayerId={localPlayerId} />
            ) : (
              <div style={{ width: 64 }} />
            )}
            {/* 1st place — center, tallest */}
            {first ? (
              <PodiumSlot result={first} height={80} localPlayerId={localPlayerId} />
            ) : (
              <div style={{ width: 64 }} />
            )}
            {/* 3rd place — right */}
            {third ? (
              <PodiumSlot result={third} height={40} localPlayerId={localPlayerId} />
            ) : (
              <div style={{ width: 64 }} />
            )}
          </div>
        </div>
      )}

      {/* Full results list */}
      <div className="flex-1 overflow-y-auto px-5 pb-3">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">All Results</p>
          {sorted.map((result, idx) => {
            const char   = CHARACTERS_LIST.find(c => c.id === result.characterId)
            const color  = char?.primaryColor ?? '#888'
            const isMe   = result.playerId === localPlayerId
            const bonus  = PLACE_COINS[result.place] ?? DEFAULT_COINS
            const xp     = PLACE_XP[result.place] ?? DEFAULT_XP
            const emoji  = PLACE_EMOJI[result.place] ?? `${result.place}.`

            return (
              <motion.div
                key={result.playerId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                style={{
                  backgroundColor: isMe ? `${color}10` : 'rgba(10,10,10,0.7)',
                  borderColor: isMe ? `${color}40` : 'rgba(255,255,255,0.06)',
                }}
              >
                {/* Place */}
                <div className="w-8 text-center flex-shrink-0">
                  <span className="text-base">{emoji}</span>
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {result.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
                    {result.displayName}{isMe && ' (you)'}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {char?.displayName ?? result.characterId}
                  </p>
                </div>

                {/* Time + stats */}
                <div className="flex-shrink-0 text-right">
                  {result.dnf ? (
                    <p className="text-red-400 font-black text-xs uppercase tracking-wider">DNF</p>
                  ) : (
                    <p className="text-white font-black text-xs tabular-nums">{formatTime(result.finishTimeMs)}</p>
                  )}
                  <p className="text-[9px] text-gray-600 tabular-nums mt-0.5">
                    💰{result.coins} · +{bonus} · +{xp}xp
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex-shrink-0 px-5 pt-2">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          {isHost ? (
            <motion.button
              onClick={onRaceAgain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest text-black bg-yellow-400 min-h-[56px]"
            >
              Race Again ▶
            </motion.button>
          ) : (
            <motion.button
              onClick={onRaceAgain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors min-h-[56px]"
            >
              Back to Lobby
            </motion.button>
          )}
          <motion.button
            onClick={onBackToMenu}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-2xl font-bold text-sm uppercase tracking-widest text-gray-500 hover:text-white transition-colors min-h-[44px]"
          >
            Main Menu
          </motion.button>
        </div>
      </div>
    </div>
  )
}

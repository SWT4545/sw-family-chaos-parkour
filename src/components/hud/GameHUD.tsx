'use client'
import { useEffect, useState } from 'react'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

const MATCH_SECS = 8 * 60

interface Props {
  player1: Character
  player2: Character | null
  matchStartTime: number
}

export function GameHUD({ player1, player2, matchStartTime }: Props) {
  const [remaining, setRemaining] = useState(MATCH_SECS)

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, MATCH_SECS - (Date.now() - matchStartTime) / 1000)
      setRemaining(r)
    }, 500)
    return () => clearInterval(id)
  }, [matchStartTime])

  const mins    = Math.floor(remaining / 60)
  const secs    = Math.floor(remaining % 60)
  const urgent  = remaining < 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-start justify-between px-3 pt-2.5 gap-2">

        {/* P1 chip */}
        <div
          className="flex items-center gap-2 rounded-xl pl-1 pr-3 py-1.5 bg-black/75 backdrop-blur-sm border"
          style={{ borderColor: `${player1.color}40` }}
        >
          <div
            className="relative w-7 h-9 rounded-lg overflow-hidden flex-shrink-0"
            style={{ boxShadow: `0 0 8px ${player1.color}60` }}
          >
            <CharacterImage
              src={player1.assets.avatar}
              alt={player1.name}
              {...CHARACTER_ALIGNMENT[player1.id]}
              sizes="28px"
            />
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold text-yellow-500">P1 · WASD/Space</p>
            <p className="text-white font-black text-xs uppercase leading-tight">{player1.name}</p>
          </div>
        </div>

        {/* Timer */}
        <div
          className="rounded-xl px-4 py-1.5 bg-black/80 backdrop-blur-sm border text-center transition-colors"
          style={{ borderColor: urgent ? '#ef444440' : 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-[8px] uppercase tracking-widest font-bold text-gray-500">Time Left</p>
          <p
            className="font-black text-xl tabular-nums leading-none transition-colors"
            style={{ color: urgent ? '#ef4444' : '#ffffff' }}
          >
            {timeStr}
          </p>
        </div>

        {/* P2 chip */}
        <div
          className="flex items-center gap-2 rounded-xl pr-1 pl-3 py-1.5 bg-black/75 backdrop-blur-sm border text-right"
          style={{ borderColor: `${player2?.color ?? '#3b82f6'}40` }}
        >
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold text-blue-400">P2 · Arrows</p>
            <p className="text-white font-black text-xs uppercase leading-tight">
              {player2?.name ?? 'Open'}
            </p>
          </div>
          {player2 && (
            <div
              className="relative w-7 h-9 rounded-lg overflow-hidden flex-shrink-0"
              style={{ boxShadow: `0 0 8px ${player2.color}60` }}
            >
              <CharacterImage
                src={player2.assets.avatar}
                alt={player2.name}
                {...CHARACTER_ALIGNMENT[player2.id]}
                sizes="28px"
              />
            </div>
          )}
        </div>

      </div>

      <div className="flex-1" />

      {/* Bottom hint */}
      <div className="flex justify-center pb-2">
        <div className="rounded-lg px-3 py-1 bg-black/50 backdrop-blur-sm border border-white/5">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">
            Reach the FINISH first to win · Fall = respawn at checkpoint
          </p>
        </div>
      </div>
    </div>
  )
}

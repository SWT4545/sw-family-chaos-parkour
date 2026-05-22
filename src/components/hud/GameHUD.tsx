'use client'
import { useEffect, useState, MutableRefObject } from 'react'
import { Character } from '@/types/player'
import { ChaosState } from '@/types/chaos'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

const MATCH_SECS = 8 * 60

interface Props {
  player1:        Character
  player2:        Character | null
  matchStartTime: number
  chaosRef:       MutableRefObject<ChaosState>
  mode:           'solo' | '1v1'
}

export function GameHUD({ player1, player2, matchStartTime, chaosRef, mode }: Props) {
  const [remaining, setRemaining] = useState(MATCH_SECS)
  const [coins, setCoins] = useState({ p1: 0, p2: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, MATCH_SECS - (Date.now() - matchStartTime) / 1000)
      setRemaining(r)
      setCoins({ p1: chaosRef.current.p1Coins, p2: chaosRef.current.p2Coins })
    }, 500)
    return () => clearInterval(id)
  }, [matchStartTime, chaosRef])

  const mins    = Math.floor(remaining / 60)
  const secs    = Math.floor(remaining % 60)
  const urgent  = remaining < 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-start justify-between px-2 sm:px-3 pt-2 gap-1.5 sm:gap-2">

        {/* P1 chip */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl pl-1 pr-2 sm:pr-3 py-1.5 bg-black/80 backdrop-blur-sm border flex-shrink"
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
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-yellow-500 hidden lg:block">
              {mode === 'solo' ? 'SOLO · WASD' : 'P1 · WASD'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-yellow-500 lg:hidden">
              {mode === 'solo' ? 'SOLO' : 'P1'}
            </p>
            <p className="text-white font-black text-xs uppercase leading-tight truncate">{player1.name}</p>
            <p className="text-[10px] font-bold tabular-nums" style={{ color: player1.color }}>
              💰 {coins.p1}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div
          className="rounded-xl px-3 sm:px-4 py-1.5 bg-black/85 backdrop-blur-sm border text-center transition-colors flex-shrink-0"
          style={{ borderColor: urgent ? '#ef444440' : 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Time</p>
          <p
            className="font-black text-xl sm:text-2xl tabular-nums leading-none transition-colors"
            style={{ color: urgent ? '#ef4444' : '#ffffff' }}
          >
            {timeStr}
          </p>
        </div>

        {/* P2 chip (1v1 only) */}
        {mode === '1v1' && (
          <div
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl pr-1 pl-2 sm:pl-3 py-1.5 bg-black/80 backdrop-blur-sm border text-right flex-shrink"
            style={{ borderColor: `${player2?.color ?? '#3b82f6'}40` }}
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400 hidden lg:block">P2 · Arrows</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400 lg:hidden">P2</p>
              <p className="text-white font-black text-xs uppercase leading-tight truncate">
                {player2?.name ?? 'Open'}
              </p>
              {player2 && (
                <p className="text-[10px] font-bold text-right tabular-nums" style={{ color: player2.color }}>
                  💰 {coins.p2}
                </p>
              )}
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
        )}

        {/* Solo spacer */}
        {mode === 'solo' && <div className="w-16 sm:w-24 flex-shrink-0" />}

      </div>

      <div className="flex-1" />

      {/* Bottom hint — desktop only */}
      <div className="hidden lg:flex justify-center pb-2">
        <div className="rounded-lg px-3 py-1 bg-black/50 backdrop-blur-sm border border-white/5">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">
            {mode === 'solo'
              ? 'Reach the FINISH · Fall = respawn at checkpoint'
              : 'Reach the FINISH first to win · Fall = respawn at checkpoint'}
          </p>
        </div>
      </div>
    </div>
  )
}

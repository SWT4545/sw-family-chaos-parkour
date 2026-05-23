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
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Top bar — compact, safe-area aware */}
      <div
        className="flex items-start justify-between gap-1.5"
        style={{ padding: '10px 10px 0' }}
      >
        {/* P1 chip */}
        <div
          className="flex items-center gap-1 rounded-lg pl-1 pr-2 py-1 bg-black/75 backdrop-blur-sm border"
          style={{ borderColor: `${player1.color}38`, maxWidth: 140 }}
        >
          <div
            className="relative w-6 h-8 rounded-md overflow-hidden flex-shrink-0"
            style={{ boxShadow: `0 0 6px ${player1.color}55` }}
          >
            <CharacterImage
              src={player1.assets.avatar}
              alt={player1.name}
              {...CHARACTER_ALIGNMENT[player1.id]}
              sizes="24px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider font-bold leading-none"
              style={{ color: player1.color }}>
              {mode === 'solo' ? 'SOLO' : 'P1'}
            </p>
            <p className="text-white font-black text-[10px] uppercase leading-tight truncate">
              {player1.name}
            </p>
            <p className="text-[9px] font-bold tabular-nums leading-none"
              style={{ color: player1.color }}>
              💰{coins.p1}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div
          className="rounded-lg px-2.5 py-1 bg-black/80 backdrop-blur-sm border text-center transition-colors flex-shrink-0"
          style={{ borderColor: urgent ? '#ef444435' : 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-[8px] uppercase tracking-widest font-bold text-gray-600 leading-none">
            TIME
          </p>
          <p
            className="font-black text-base tabular-nums leading-none mt-0.5 transition-colors"
            style={{ color: urgent ? '#ef4444' : '#ffffff' }}
          >
            {timeStr}
          </p>
        </div>

        {/* P2 chip (1v1 only) */}
        {mode === '1v1' && player2 ? (
          <div
            className="flex items-center gap-1 rounded-lg pr-1 pl-2 py-1 bg-black/75 backdrop-blur-sm border text-right"
            style={{ borderColor: `${player2.color}38`, maxWidth: 140 }}
          >
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-bold leading-none text-right"
                style={{ color: player2.color }}>
                P2
              </p>
              <p className="text-white font-black text-[10px] uppercase leading-tight truncate">
                {player2.name}
              </p>
              <p className="text-[9px] font-bold tabular-nums leading-none text-right"
                style={{ color: player2.color }}>
                💰{coins.p2}
              </p>
            </div>
            <div
              className="relative w-6 h-8 rounded-md overflow-hidden flex-shrink-0"
              style={{ boxShadow: `0 0 6px ${player2.color}55` }}
            >
              <CharacterImage
                src={player2.assets.avatar}
                alt={player2.name}
                {...CHARACTER_ALIGNMENT[player2.id]}
                sizes="24px"
              />
            </div>
          </div>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </div>

      <div className="flex-1" />

      {/* Bottom hint — desktop only */}
      <div className="hidden lg:flex justify-center pb-2 absolute bottom-0 inset-x-0">
        <div className="rounded-lg px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/5">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">
            {mode === 'solo'
              ? 'Reach the FINISH · Fall = respawn at checkpoint'
              : 'First to FINISH wins · F = emote'}
          </p>
        </div>
      </div>
    </div>
  )
}

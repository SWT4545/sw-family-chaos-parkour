'use client'
import { useEffect, useState, MutableRefObject } from 'react'
import { Character } from '@/types/player'
import { ChaosState } from '@/types/chaos'

const MATCH_SECS = 8 * 60

interface Props {
  player1:        Character
  player2:        Character | null
  matchStartTime: number
  chaosRef:       MutableRefObject<ChaosState>
  mode:           'solo' | '1v1' | 'online'
  levelName?:     string
}

export function GameHUD({ player1, player2, matchStartTime, chaosRef, mode, levelName }: Props) {
  const [display, setDisplay] = useState(mode === 'solo' ? 0 : MATCH_SECS)
  const [coins, setCoins] = useState({ p1: 0, p2: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.max(0, (Date.now() - matchStartTime) / 1000)
      const val = mode === 'solo' ? elapsed : Math.max(0, MATCH_SECS - elapsed)
      setDisplay(val)
      setCoins({ p1: chaosRef.current.p1Coins, p2: chaosRef.current.p2Coins })
    }, 500)
    return () => clearInterval(id)
  }, [matchStartTime, chaosRef, mode])

  const mins    = Math.floor(display / 60)
  const secs    = Math.floor(display % 60)
  const urgent  = mode !== 'solo' && display < 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div
      className="absolute inset-x-0 top-0 pointer-events-none select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="flex items-center justify-between gap-1 px-3 py-1.5 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.80)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* P1 */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: player1.color, boxShadow: `0 0 5px ${player1.color}` }}
          />
          <span className="font-black text-[10px] uppercase tracking-wider truncate" style={{ color: player1.color }}>
            {player1.name}
          </span>
          <span className="text-[9px] font-bold text-yellow-400 tabular-nums">💰{coins.p1}</span>
        </div>

        {/* Timer */}
        <div className="flex-shrink-0 text-center">
          <span
            className="font-black text-sm tabular-nums leading-none transition-colors"
            style={{ color: urgent ? '#ef4444' : '#ffffff' }}
          >
            {timeStr}
          </span>
        </div>

        {/* Right side: P2 info for 1v1/online, or level name for solo */}
        {mode !== 'solo' && player2 ? (
          <div className="flex items-center gap-1.5 min-w-0 justify-end">
            <span className="text-[9px] font-bold text-yellow-400 tabular-nums">💰{coins.p2}</span>
            <span className="font-black text-[10px] uppercase tracking-wider truncate" style={{ color: player2.color }}>
              {player2.name}
            </span>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: player2.color, boxShadow: `0 0 5px ${player2.color}` }}
            />
          </div>
        ) : (
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[90px] text-right">
            {levelName ?? ''}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, MutableRefObject } from 'react'
import { Character } from '@/types/player'
import { ChaosState } from '@/types/chaos'

const MATCH_SECS = 8 * 60

export interface RaceProgressEntry {
  playerId: string
  name:     string
  color:    string
  pct:      number
  finished: boolean
}

interface Props {
  player1:        Character
  player2:        Character | null
  matchStartTime: number
  chaosRef:       MutableRefObject<ChaosState>
  mode:           'solo' | '1v1' | 'online'
  levelName?:     string
  soloLives?:     number               // max lives; undefined = unlimited (Training Grounds)
  isWorldLevel?:  boolean              // true when in campaign — always show lives row
  raceProgress?:  RaceProgressEntry[]
}

function RaceProgressBar({ raceProgress }: { raceProgress: RaceProgressEntry[] }) {
  const sorted = [...raceProgress].sort((a, b) => b.pct - a.pct)
  return (
    <div
      className="relative w-full"
      style={{ height: 36, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="absolute" style={{ left: 8, right: 8, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1 }} />
      {sorted.map((entry, i) => (
        <div
          key={entry.playerId}
          className="absolute flex flex-col items-center pointer-events-none"
          style={{
            left:      `calc(8px + (100% - 16px) * ${entry.pct / 100})`,
            top:       '50%',
            transform: 'translate(-50%, -50%)',
            zIndex:    10 + (raceProgress.length - i),
            transition: 'left 0.3s ease-out',
          }}
        >
          {entry.finished
            ? <span style={{ fontSize: 12, lineHeight: 1 }}>🏁</span>
            : <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: entry.color, boxShadow: `0 0 5px ${entry.color}`, border: '1.5px solid rgba(0,0,0,0.5)' }} />
          }
          <span className="font-bold select-none" style={{ fontSize: 7, color: entry.color, lineHeight: 1, marginTop: 1, maxWidth: 32, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.name.slice(0, 6)}
          </span>
        </div>
      ))}
    </div>
  )
}

function LivesDisplay({ lives, maxLives }: { lives: number | undefined; maxLives: number | undefined }) {
  // maxLives undefined = Training Grounds / unlimited lives
  if (maxLives === undefined) {
    return <span className="text-xs font-black" style={{ color: '#4ade80' }}>∞</span>
  }
  // Use maxLives as fallback until chaosRef first sync fires
  const count  = Math.max(0, lives ?? maxLives)
  const hearts = Array.from({ length: Math.max(maxLives, count) }, (_, i) => i < count)
  return (
    <div className="flex items-center gap-0.5">
      {hearts.slice(0, 6).map((filled, i) => (
        <span key={i} className="text-[10px] leading-none" style={{ opacity: filled ? 1 : 0.25 }}>❤️</span>
      ))}
    </div>
  )
}

export function GameHUD({ player1, player2, matchStartTime, chaosRef, mode, levelName, soloLives, isWorldLevel, raceProgress }: Props) {
  const [display,  setDisplay]  = useState(mode === 'solo' ? 0 : MATCH_SECS)
  const [coins,    setCoins]    = useState({ p1: 0, p2: 0 })
  const [lives,    setLives]    = useState<number | undefined>(soloLives)

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.max(0, (Date.now() - matchStartTime) / 1000)
      const val     = mode === 'solo' ? elapsed : Math.max(0, MATCH_SECS - elapsed)
      setDisplay(val)
      setCoins({ p1: chaosRef.current.p1Coins, p2: chaosRef.current.p2Coins })
      // Read live lives count from chaos ref (updated by GameCanvas)
      if (soloLives !== undefined) {
        setLives(chaosRef.current.p1Lives)
      }
    }, 250)
    return () => clearInterval(id)
  }, [matchStartTime, chaosRef, mode, soloLives])

  const mins    = Math.floor(display / 60)
  const secs    = Math.floor(display % 60)
  const urgent  = mode !== 'solo' && display < 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="w-full select-none" style={{ background: 'rgba(0,0,0,0.88)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Race progress bar */}
      {raceProgress && raceProgress.length > 0 && (
        <RaceProgressBar raceProgress={raceProgress} />
      )}

      {/* Main HUD row */}
      <div className="flex items-center justify-between gap-1 px-3" style={{ height: 52, paddingTop: 'env(safe-area-inset-top)' }}>

        {/* Left — character + lives + coins */}
        <div className="flex flex-col justify-center min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: player1.color, boxShadow: `0 0 4px ${player1.color}` }} />
            <span className="font-black text-[9px] uppercase tracking-wider truncate max-w-[60px]" style={{ color: player1.color }}>
              {player1.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {mode === 'solo' && isWorldLevel ? (
              // Campaign mode — always show lives (∞ for Training Grounds, hearts otherwise)
              <>
                <LivesDisplay lives={lives} maxLives={soloLives} />
                <span className="text-[9px] font-bold text-yellow-400 tabular-nums">💰{coins.p1}</span>
              </>
            ) : (
              <span className="text-[9px] font-bold text-yellow-400 tabular-nums">💰{coins.p1}</span>
            )}
          </div>
        </div>

        {/* Center — timer */}
        <div className="flex-shrink-0 text-center">
          <span
            className="font-black text-base tabular-nums leading-none transition-colors"
            style={{ color: urgent ? '#ef4444' : '#ffffff' }}
          >
            {timeStr}
          </span>
          {mode === 'solo' && levelName && (
            <p className="text-[7px] text-gray-600 uppercase tracking-widest leading-none mt-0.5 truncate max-w-[90px] mx-auto">
              {levelName}
            </p>
          )}
        </div>

        {/* Right — P2 for 1v1/online, or nothing for solo */}
        {mode !== 'solo' && player2 ? (
          <div className="flex flex-col justify-center items-end min-w-0 gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[9px] uppercase tracking-wider truncate max-w-[60px]" style={{ color: player2.color }}>
                {player2.name}
              </span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: player2.color, boxShadow: `0 0 4px ${player2.color}` }} />
            </div>
            <span className="text-[9px] font-bold text-yellow-400 tabular-nums">💰{coins.p2}</span>
          </div>
        ) : (
          <div className="w-16" /> // spacer to balance left side
        )}
      </div>
    </div>
  )
}

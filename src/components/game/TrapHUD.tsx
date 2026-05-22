'use client'
import { useEffect, useState, MutableRefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChaosState, defaultChaosState, PlayerChaosState } from '@/types/chaos'
import { Character } from '@/types/player'

const R    = 20
const CIRC = 2 * Math.PI * R

function CooldownRing({ pct, color }: { pct: number; color: string }) {
  const offset = CIRC * pct
  const ready  = pct === 0
  return (
    <svg width={48} height={48} className="-rotate-90 flex-shrink-0">
      <circle cx={24} cy={24} r={R} fill="none"
        stroke="rgba(255,255,255,0.1)" strokeWidth={3.5} />
      <circle cx={24} cy={24} r={R} fill="none"
        stroke={ready ? color : 'rgba(255,255,255,0.25)'}
        strokeWidth={3.5}
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
      />
    </svg>
  )
}

interface PlayerPanelProps {
  player:  Character
  state:   PlayerChaosState
  side:    'left' | 'right'
  keyHint: string
}

function PlayerPanel({ player, state, side, keyHint }: PlayerPanelProps) {
  const ready   = state.cooldownPct === 0
  const colored = ready ? player.color : 'rgba(255,255,255,0.3)'
  const isLeft  = side === 'left'

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-1.5 sm:px-2 py-1.5 border backdrop-blur-sm
        ${isLeft ? '' : 'flex-row-reverse'}`}
      style={{
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderColor: ready ? `${player.color}50` : 'rgba(255,255,255,0.08)',
        boxShadow:   ready ? `0 0 12px ${player.color}30` : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Cooldown ring + trap icon */}
      <div className="relative flex-shrink-0">
        <CooldownRing pct={state.cooldownPct} color={player.color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg leading-none" style={{ filter: ready ? 'none' : 'grayscale(1)' }}>
            {state.trapIcon}
          </span>
        </div>
      </div>

      {/* Name + key hint */}
      <div className={`min-w-0 ${isLeft ? '' : 'text-right'}`}>
        <p className="text-[10px] uppercase tracking-widest font-bold leading-none mb-0.5"
          style={{ color: colored }}>
          {state.trapName || '—'}
        </p>
        {/* Key hint — hidden on touch/mobile */}
        <p className="text-[8px] text-gray-600 uppercase tracking-widest hidden lg:block">
          Press&nbsp;<span className="text-gray-400 font-bold">{keyHint}</span>
        </p>
      </div>

      {/* Active effect badge */}
      <AnimatePresence>
        {state.effectLabel && (
          <motion.span
            key={state.effectLabel}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${state.effectColor ?? '#fff'}25`, color: state.effectColor ?? '#fff' }}
          >
            {state.effectLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TrapHUDProps {
  player1:    Character
  player2:    Character | null
  chaosRef:   MutableRefObject<ChaosState>
}

export function TrapHUD({ player1, player2, chaosRef }: TrapHUDProps) {
  const [snap, setSnap] = useState<ChaosState>(() => defaultChaosState())

  useEffect(() => {
    const id = setInterval(() => setSnap({ ...chaosRef.current }), 80)
    return () => clearInterval(id)
  }, [chaosRef])

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none select-none z-10"
      style={{ paddingTop: '56px' }}>
      <div className="flex items-start justify-between px-2 sm:px-3 gap-2">

        {/* P1 panel */}
        <PlayerPanel
          player={player1}
          state={snap.p1}
          side="left"
          keyHint="Q"
        />

        {/* Taco rain warning */}
        <AnimatePresence>
          {snap.tacoRainActive && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl px-3 py-1.5 text-center backdrop-blur-sm border border-yellow-500/30 bg-black/70"
            >
              <p className="text-[11px] uppercase tracking-widest font-black text-yellow-400">
                🌮 TACO RAIN! 🌮
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* P2 panel */}
        {player2 ? (
          <PlayerPanel
            player={player2}
            state={snap.p2}
            side="right"
            keyHint="/"
          />
        ) : (
          <div className="w-24 sm:w-32" />
        )}

      </div>
    </div>
  )
}

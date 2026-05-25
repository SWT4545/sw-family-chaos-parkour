'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  countdownStartAt: number
  levelName:        string
  playerCount:      number
  onGo:             () => void
}

type CountdownLabel = '3' | '2' | '1' | 'GO!'

function getLabel(elapsed: number): CountdownLabel {
  if (elapsed < 1000) return '3'
  if (elapsed < 2000) return '2'
  if (elapsed < 3000) return '1'
  return 'GO!'
}

export function RaceCountdown({ countdownStartAt, levelName, playerCount, onGo }: Props) {
  const [label,   setLabel]   = useState<CountdownLabel>(() => {
    const elapsed = Date.now() - countdownStartAt
    return getLabel(Math.max(0, elapsed))
  })
  const goCalled = useRef(false)

  useEffect(() => {
    // Handle late join: already past countdown
    const initial = Date.now() - countdownStartAt
    if (initial > 3500) {
      if (!goCalled.current) { goCalled.current = true; onGo() }
      return
    }

    const id = setInterval(() => {
      const elapsed = Date.now() - countdownStartAt
      const next = getLabel(Math.max(0, elapsed))
      setLabel(next)

      if (elapsed >= 3000 && !goCalled.current) {
        // Wait 500ms after GO! then fire
        setTimeout(() => {
          if (!goCalled.current) { goCalled.current = true; onGo() }
        }, 500)
      }
    }, 100)

    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownStartAt])

  const isGo = label === 'GO!'

  return (
    <div
      className="h-dvh flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#020208' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isGo
            ? 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(74,222,128,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
          transition: 'background 0.4s',
        }}
      />

      {/* Level info */}
      <div className="absolute top-0 left-0 right-0 text-center pt-16" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}>
        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-600 font-bold">Level</p>
        <p className="text-gray-300 font-black text-lg uppercase tracking-wide mt-0.5">{levelName}</p>
        <p className="text-gray-600 text-xs mt-1">Racing with {playerCount} player{playerCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Countdown number */}
      <div className="flex items-center justify-center" style={{ height: 240 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={label}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ color: isGo ? '#4ade80' : '#ffffff' }}
          >
            <span
              className="font-black select-none"
              style={{
                fontSize: isGo ? '7rem' : '9rem',
                lineHeight: 1,
                textShadow: isGo
                  ? '0 0 60px rgba(74,222,128,0.5), 0 0 120px rgba(74,222,128,0.2)'
                  : '0 0 40px rgba(255,255,255,0.25)',
              }}
            >
              {label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtitle */}
      <div className="absolute bottom-0 left-0 right-0 text-center pb-16" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 48px)' }}>
        <p
          className="text-sm font-bold uppercase tracking-widest animate-pulse"
          style={{ color: isGo ? '#4ade80' : '#6b7280' }}
        >
          {isGo ? 'GO GO GO!' : 'Race starting...'}
        </p>
      </div>
    </div>
  )
}

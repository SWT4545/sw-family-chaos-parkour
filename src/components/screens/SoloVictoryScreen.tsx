'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Star } from 'lucide-react'
import { Character } from '@/types/player'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'

const MATCH_SECS = 8 * 60

function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const GAMEPLAY_IDS = new Set(['commander', 'bj', 'brae', 'xanny'])
function gameplayImg(id: string) {
  return GAMEPLAY_IDS.has(id)
    ? `/game-assets/characters-gameplay/${id}/${id}-full.png`
    : `/game-assets/characters-normalized/${id}/${id}-full.png`
}

function getBadge(didFinish: boolean, time: number, coins: number, isNewBest: boolean) {
  if (!didFinish) return { label: "Time's Up!",      emoji: '⏰', color: '#6b7280' }
  if (isNewBest)  return { label: 'New Best Time!',  emoji: '🏆', color: '#fbbf24' }
  if (time < 90)  return { label: 'Blazing Fast!',   emoji: '⚡', color: '#60a5fa' }
  if (coins >= 8) return { label: 'Coin Hunter!',    emoji: '💰', color: '#f59e0b' }
  return             { label: 'Run Complete!',        emoji: '✅', color: '#10b981' }
}

interface Props {
  player:       Character
  time:         number
  coins:        number
  onPlayAgain:  () => void
  onBackToMenu: () => void
}

interface Piece {
  id: number; x: number; delay: number; dur: number
  color: string; size: number; drift: number; rot: number; shape: 'rect' | 'star'
}

export function SoloVictoryScreen({ player, time, coins, onPlayAgain, onBackToMenu }: Props) {
  const didFinish = time < MATCH_SECS - 0.5
  const profile   = LocalProfiles.getByCharacter(player.id)
  const prevBest  = profile?.bestSoloTime ?? null
  const isNewBest = didFinish && (prevBest === null || time <= prevBest)
  const badge     = getBadge(didFinish, time, coins, isNewBest)
  const col       = player.color

  const confetti = useMemo<Piece[]>(() => {
    const palette = isNewBest
      ? [col, '#fbbf24', '#ffffff', '#f97316', col + 'cc', '#fbbf24']
      : [col, '#ffffff', col + '99', '#ffffff88']
    return Array.from({ length: isNewBest ? 70 : 45 }, (_, i) => ({
      id:    i,
      x:     Math.random() * 105 - 2,
      delay: Math.random() * 2.8,
      dur:   1.8 + Math.random() * 2.2,
      color: palette[i % palette.length],
      size:  5 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 200,
      rot:   (Math.random() - 0.5) * 720,
      shape: Math.random() > 0.7 ? 'star' : 'rect',
    }))
  }, [col, isNewBest])

  const starBursts = useMemo(() =>
    isNewBest ? Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: 15 + i * 18,
      delay: 0.4 + i * 0.12,
    })) : []
  , [isNewBest])

  return (
    <div className="relative h-dvh overflow-hidden" style={{ backgroundColor: '#02020C' }}>

      {/* Atmosphere */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{ background: `radial-gradient(ellipse 110% 90% at 50% 60%, ${col}2a 0%, ${col}0c 45%, transparent 72%)` }}
      />
      <div className="absolute inset-0 opacity-[0.09]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(32px)', transform: 'scale(1.1)' }} />

      {/* Burst rings */}
      {[0, 0.2, 0.38].map((delay, i) => (
        <motion.div key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ border: `2px solid ${col}`, width: 60, height: 60 }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 10, opacity: 0 }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      ))}

      {/* New best: star pop row */}
      {starBursts.map(s => (
        <motion.div key={s.id}
          className="absolute top-[18vh] pointer-events-none z-20 text-2xl"
          style={{ left: `${s.x}%` }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.4, 1, 0], y: -40 }}
          transition={{ duration: 1.0, delay: s.delay, ease: 'easeOut' }}>
          ⭐
        </motion.div>
      ))}

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {confetti.map(p => (
          <motion.div key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`, top: -16,
              width: p.size, height: p.shape === 'star' ? p.size : p.size * 0.45,
              backgroundColor: p.shape === 'star' ? 'transparent' : p.color,
              color: p.color, fontSize: p.size, lineHeight: 1,
              borderRadius: p.shape === 'star' ? 0 : 2,
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', x: p.drift, rotate: p.rot, opacity: [1, 1, 0.7, 0] }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'linear', repeat: Infinity, repeatDelay: Math.random() * 1.8 }}>
            {p.shape === 'star' ? '★' : ''}
          </motion.div>
        ))}
      </div>

      {/* Character image */}
      <motion.img
        key={player.id}
        src={gameplayImg(player.id)}
        alt={player.name}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none z-20"
        style={{ maxHeight: '66vh', maxWidth: '100vw', width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'bottom center' }}
        initial={{ y: 70, opacity: 0, scale: 0.85 }}
        animate={{ y: 0,  opacity: 1, scale: 1   }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Ground glow */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-15"
        style={{ background: `linear-gradient(to top, ${col}20 0%, transparent 100%)` }} />

      {/* Top overlay */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>

        {/* Badge */}
        <motion.div className="flex justify-center mb-3"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}>
          <motion.div
            className="flex items-center gap-2 px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.28em]"
            style={{ backgroundColor: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}55` }}
            animate={isNewBest ? { scale: [1, 1.06, 1] } : {}}
            transition={isNewBest ? { duration: 0.5, delay: 0.8, repeat: 3 } : {}}>
            <span>{badge.emoji}</span> {badge.label}
          </motion.div>
        </motion.div>

        {/* Name */}
        <motion.div className="text-center px-4"
          initial={{ opacity: 0, scale: 0.65, y: -8 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          transition={{ duration: 0.5, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="font-black uppercase leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 7rem)',
              color: col,
              textShadow: `0 0 40px ${col}99, 0 0 80px ${col}44`,
            }}>
            {player.name}
          </h1>
          <motion.p className="text-white/35 text-xs font-bold uppercase tracking-[0.35em] mt-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}>
            &ldquo;{player.tagline}&rdquo;
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 inset-x-0 z-30"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* Stats */}
        <motion.div className="mx-4 mb-3 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.74)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.72 }}>
          <div className="flex">
            {/* Time */}
            <div className="flex-1 flex flex-col items-center py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Time</span>
              <span className="text-white font-black text-xl tabular-nums">⏱ {fmtTime(time)}</span>
            </div>
            {/* Coins */}
            <div className="flex-1 flex flex-col items-center py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Coins</span>
              <span className="text-yellow-400 font-black text-xl">💰 {coins}</span>
            </div>
            {/* Best */}
            <div className="flex-1 flex flex-col items-center py-3">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Star size={8} />
                <span className="text-[8px] uppercase tracking-widest font-bold">Best</span>
              </div>
              <span className="font-black text-xl tabular-nums"
                style={{ color: isNewBest ? '#fbbf24' : 'rgba(255,255,255,0.55)' }}>
                {prevBest !== null ? fmtTime(Math.min(prevBest, time)) : fmtTime(time)}
                {isNewBest && <span className="text-[10px] ml-1 font-bold">NEW</span>}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div className="flex gap-3 px-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.92 }}>
          <button onClick={onBackToMenu}
            className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15"
            style={{ height: 56, paddingInline: 20 }}>
            <Home size={14} /> Menu
          </button>
          <motion.button onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest"
            style={{ height: 56, background: col, color: '#000' }}
            whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.97 }}>
            <RotateCcw size={16} /> Play Again
          </motion.button>
        </motion.div>
      </div>

    </div>
  )
}

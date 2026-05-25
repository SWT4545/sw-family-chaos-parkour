'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Map, ArrowRight, Star } from 'lucide-react'
import { Character } from '@/types/player'
import type { ScoreBreakdown } from '@/lib/game/scoring/ScoreTypes'

const MATCH_SECS = 8 * 60

function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const CELEB_IDS = new Set(['commander', 'bj', 'brae', 'xanny'])
function celebImg(id: string) {
  return CELEB_IDS.has(id)
    ? `/game-assets/characters-victory/${id}/${id}-celeb.png`
    : `/game-assets/characters-normalized/${id}/${id}-full.png`
}

interface Props {
  player:           Character
  time:             number           // seconds elapsed
  coins:            number           // coins collected in run
  starsEarned:      0|1|2|3
  coinsEarned:      number           // net coins from completion result
  xpEarned:         number
  isFirstClear:     boolean
  nextLevel?:       { id: string; title: string; subtitle: string }
  unlockedItems?:   string[]         // character/world unlocked names
  scoreBreakdown?:  ScoreBreakdown
  deaths?:          number
  onPlayAgain:      () => void
  onNextLevel?:     () => void
  onWorldMap:       () => void
}

interface Piece {
  id: number; x: number; delay: number; dur: number
  color: string; size: number; drift: number; rot: number; shape: 'rect' | 'star'
}

function StarRow({ stars, color }: { stars: 0|1|2|3; color: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {[1, 2, 3].map(n => (
        <motion.div
          key={n}
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.6 + n * 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <Star
            size={32}
            fill={n <= stars ? color : 'transparent'}
            stroke={n <= stars ? color : 'rgba(255,255,255,0.15)'}
            strokeWidth={1.5}
            style={{ filter: n <= stars ? `drop-shadow(0 0 8px ${color}99)` : undefined }}
          />
        </motion.div>
      ))}
    </div>
  )
}

export function SoloVictoryScreen({
  player, time, coins, starsEarned, coinsEarned, xpEarned,
  isFirstClear, nextLevel, unlockedItems, scoreBreakdown, deaths,
  onPlayAgain, onNextLevel, onWorldMap,
}: Props) {
  const didFinish = time < MATCH_SECS - 0.5
  const col       = player.color

  const badge = useMemo(() => {
    if (!didFinish)     return { label: "Time's Up!",     emoji: '⏰', color: '#6b7280' }
    if (starsEarned === 3) return { label: 'Perfect Run!',   emoji: '⭐', color: '#fbbf24' }
    if (isFirstClear)   return { label: 'First Clear!',   emoji: '🏆', color: '#f59e0b' }
    if (starsEarned === 2) return { label: 'Great Time!',   emoji: '⚡', color: '#60a5fa' }
    return               { label: 'Run Complete!',        emoji: '✅', color: '#10b981' }
  }, [didFinish, starsEarned, isFirstClear])

  const confetti = useMemo<Piece[]>(() => {
    const palette = starsEarned === 3
      ? [col, '#fbbf24', '#ffffff', '#f97316', col + 'cc', '#fbbf24']
      : [col, '#ffffff', col + '99', '#ffffff88']
    return Array.from({ length: starsEarned === 3 ? 70 : 45 }, (_, i) => ({
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
  }, [col, starsEarned])

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
        src={celebImg(player.id)}
        alt={player.name}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none z-20"
        style={{ maxHeight: '60vh', maxWidth: '100vw', width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'bottom center' }}
        initial={{ y: 70, opacity: 0, scale: 0.85 }}
        animate={{ y: 0,  opacity: 1, scale: 1   }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Ground glow */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${col}20 0%, transparent 100%)` }} />

      {/* Top overlay */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>

        {/* Badge */}
        <motion.div className="flex justify-center mb-2"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}>
          <div
            className="flex items-center gap-2 px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.28em]"
            style={{ backgroundColor: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}55` }}>
            <span>{badge.emoji}</span> {badge.label}
          </div>
        </motion.div>

        {/* Name */}
        <motion.div className="text-center px-4"
          initial={{ opacity: 0, scale: 0.65, y: -8 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          transition={{ duration: 0.5, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="font-black uppercase leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(3rem, 12vw, 6rem)',
              color: col,
              textShadow: `0 0 40px ${col}99, 0 0 80px ${col}44`,
            }}>
            {player.name}
          </h1>
        </motion.div>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 inset-x-0 z-30"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>

        {/* Stars */}
        <motion.div
          className="mx-4 mb-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.74)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.55 }}>
          <StarRow stars={starsEarned} color={col} />
        </motion.div>

        {/* Stats */}
        <motion.div className="mx-4 mb-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.74)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.68 }}>
          <div className="flex">
            {/* Time */}
            <div className="flex-1 flex flex-col items-center py-2.5" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Time</span>
              <span className="text-white font-black text-lg tabular-nums">⏱ {fmtTime(time)}</span>
            </div>
            {/* Coins earned */}
            <div className="flex-1 flex flex-col items-center py-2.5" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Coins</span>
              <span className="text-yellow-400 font-black text-lg">+{coinsEarned}</span>
            </div>
            {/* XP earned */}
            <div className="flex-1 flex flex-col items-center py-2.5">
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">XP</span>
              <span className="font-black text-lg tabular-nums" style={{ color: col }}>
                +{xpEarned}
              </span>
            </div>
          </div>

          {/* Unlock messages */}
          {(isFirstClear || (unlockedItems && unlockedItems.length > 0)) && (
            <div className="border-t border-white/5 px-4 py-2">
              {isFirstClear && (
                <p className="text-[10px] text-center font-bold" style={{ color: col }}>
                  🎉 First Clear Bonus!
                </p>
              )}
              {unlockedItems?.map(item => (
                <p key={item} className="text-[10px] text-center text-emerald-400 font-bold mt-0.5">
                  🔓 Unlocked: {item.charAt(0).toUpperCase() + item.slice(1)}
                </p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Score breakdown */}
        {scoreBreakdown && (
          <motion.div className="mx-4 mb-2 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.74)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.78 }}>
            {/* Final score */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Score</span>
              <span className="text-lg font-black tabular-nums" style={{ color: col }}>
                {scoreBreakdown.finalScore.toLocaleString()}
              </span>
            </div>
            {/* Breakdown rows */}
            <div className="px-4 py-2 flex flex-col gap-0.5">
              {[
                { label: 'Completion',    val: scoreBreakdown.basePoints,       positive: true },
                { label: 'Coins',         val: scoreBreakdown.coinPoints,       positive: true },
                { label: 'Time Bonus',    val: scoreBreakdown.timeBonus,        positive: true },
                { label: 'No Deaths',     val: scoreBreakdown.noDeathBonus,     positive: true },
                { label: 'All Coins',     val: scoreBreakdown.allCoinsBonus,    positive: true },
                { label: 'New Best Time', val: scoreBreakdown.newBestTimeBonus, positive: true },
                { label: 'Deaths',        val: -scoreBreakdown.deathPenalty,    positive: false },
                { label: 'Trap Hits',     val: -scoreBreakdown.trapHitPenalty,  positive: false },
              ].filter(r => r.val !== 0).map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">{row.label}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: row.positive ? '#4ade80' : '#f87171' }}>
                    {row.val > 0 ? `+${row.val.toLocaleString()}` : row.val.toLocaleString()}
                  </span>
                </div>
              ))}
              {scoreBreakdown.difficultyMult !== 1.0 && (
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Difficulty</span>
                  <span className="text-[10px] font-black" style={{ color: col }}>×{scoreBreakdown.difficultyMult.toFixed(2)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div className="flex flex-col gap-2 px-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.88 }}>

          {/* Primary action */}
          {nextLevel && onNextLevel ? (
            <motion.button onClick={onNextLevel}
              className="flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest"
              style={{ height: 56, background: col, color: '#000' }}
              whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.97 }}>
              Next Level <ArrowRight size={18} />
              <span className="text-xs font-bold opacity-70 ml-1">({nextLevel.title})</span>
            </motion.button>
          ) : (
            <motion.button onClick={onWorldMap}
              className="flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest"
              style={{ height: 56, background: col, color: '#000' }}
              whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.97 }}>
              <Map size={18} /> World Map
            </motion.button>
          )}

          {/* Secondary row */}
          <div className="flex gap-2">
            <button onClick={onWorldMap}
              className="flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-400 border border-white/10 flex-1"
              style={{ height: 44 }}>
              <Map size={12} /> Map
            </button>
            <button onClick={onPlayAgain}
              className="flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white border border-white/15 flex-1"
              style={{ height: 44 }}>
              <RotateCcw size={12} /> Retry
            </button>
            <button onClick={onWorldMap}
              className="flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 flex-1"
              style={{ height: 44 }}>
              <Home size={12} /> Menu
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  )
}

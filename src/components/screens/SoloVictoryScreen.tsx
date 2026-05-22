'use client'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Clock, Star } from 'lucide-react'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'

const MATCH_SECS = 8 * 60

function fmtTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function getVictoryBadge(didFinish: boolean, time: number, coins: number, isNewBest: boolean) {
  if (!didFinish) return { label: "Time's Up!",      color: '#6b7280', bg: '#6b728018' }
  if (isNewBest)  return { label: 'New Best Time!',  color: '#fbbf24', bg: '#fbbf2422' }
  if (time < 120) return { label: 'Blazing Fast!',   color: '#60a5fa', bg: '#60a5fa20' }
  if (coins >= 5) return { label: 'Coin Collector!', color: '#f59e0b', bg: '#f59e0b20' }
  return             { label: 'Run Complete!',       color: '#10b981', bg: '#10b98120' }
}

interface Props {
  player:       Character
  time:         number
  coins:        number
  onPlayAgain:  () => void
  onBackToMenu: () => void
}

export function SoloVictoryScreen({ player, time, coins, onPlayAgain, onBackToMenu }: Props) {
  const didFinish = time < MATCH_SECS - 0.5
  const profile   = LocalProfiles.getByCharacter(player.id)
  const bestTime  = profile?.bestSoloTime ?? null
  const isNewBest = didFinish && (bestTime === null || time < bestTime)
  const badge     = getVictoryBadge(didFinish, time, coins, isNewBest)

  return (
    <div
      className="relative h-dvh overflow-hidden flex flex-col"
      style={{ backgroundColor: '#020208' }}
    >
      {/* Ambient character glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 58%, ${player.color}20 0%, transparent 68%)`,
        }}
      />

      {/* Blurred poster bg */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(28px)', transform: 'scale(1.08)',
        }}
      />

      <div
        className="relative z-10 flex flex-col h-full"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >

        {/* ── Rarity badge ──────────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 flex justify-center pt-5 pb-1"
          initial={{ opacity: 0, y: -22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
          <div
            className="px-5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-[0.28em]"
            style={{
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.color}55`,
            }}
          >
            {badge.label}
          </div>
        </motion.div>

        {/* ── Character name + tagline ───────────────────────────── */}
        <motion.div
          className="flex-shrink-0 text-center px-4 pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }}
        >
          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none tracking-tight"
            style={{ color: player.color }}
          >
            {player.name}
          </h1>
          <p className="text-gray-500 text-xs mt-2 italic tracking-wide">
            &ldquo;{player.tagline}&rdquo;
          </p>
        </motion.div>

        {/* ── Victory character card — fills remaining space ─────── */}
        <motion.div
          className="flex-1 flex items-end justify-center px-4 min-h-0"
          initial={{ opacity: 0, scale: 0.88, y: 32 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              width:       'min(84vw, 320px)',
              aspectRatio: '2 / 3',
              border:      `2px solid ${player.color}50`,
              boxShadow:   `0 0 60px ${player.color}30, 0 0 120px ${player.color}12`,
            }}
          >
            <CharacterImage
              src={player.assets.victory}
              alt={`${player.name} victory`}
              {...CHARACTER_ALIGNMENT[player.id]}
              sizes="(max-width: 640px) 84vw, 320px"
              priority
            />
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ boxShadow: `inset 0 0 40px ${player.color}16` }}
            />
          </div>
        </motion.div>

        {/* ── Stats glass panel ──────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 px-4 pt-4 pb-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.9, ease: 'easeOut' }}
        >
          <div
            className="rounded-2xl grid grid-cols-3 overflow-hidden"
            style={{
              border:          '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            {[
              { label: 'TIME',  value: fmtTime(time),                         icon: <Clock size={10} /> },
              { label: 'COINS', value: `💰 ${coins}`,                         icon: null               },
              { label: 'BEST',  value: bestTime !== null ? fmtTime(bestTime) : '—', icon: <Star size={10} /> },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 px-2"
                style={{
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-center gap-1 text-gray-600 mb-1.5">
                  {s.icon}
                  <span className="text-[9px] uppercase tracking-widest font-bold">{s.label}</span>
                </div>
                <span className="text-white font-black text-base tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Action buttons ─────────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2, ease: 'easeOut' }}
        >
          <div className="flex gap-3">
            <button
              onClick={onBackToMenu}
              className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15 hover:bg-white/8 transition-colors"
              style={{ height: '58px', paddingInline: '22px' }}
            >
              <Home size={15} />
              Menu
            </button>
            <motion.button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest text-black"
              style={{ height: '58px', backgroundColor: '#eab308' }}
              whileHover={{ scale: 1.02, backgroundColor: '#fbbf24' }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={16} />
              Play Again
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

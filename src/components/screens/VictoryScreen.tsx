'use client'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Clock } from 'lucide-react'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

function fmtTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface Props {
  winner:        Character | null
  loser:         Character | null
  time:          number
  winnerCoins:   number
  loserCoins:    number
  onPlayAgain:   () => void
  onBackToLobby: () => void
}

export function VictoryScreen({ winner, loser, time, winnerCoins, loserCoins, onPlayAgain, onBackToLobby }: Props) {
  const winColor = winner?.color ?? '#eab308'

  return (
    <div
      className="relative h-dvh overflow-hidden flex flex-col"
      style={{ backgroundColor: '#020208' }}
    >
      {/* Ambient winner color glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 58%, ${winColor}1e 0%, transparent 68%)`,
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

        {/* ── Victory badge ──────────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 flex justify-center pt-5 pb-1"
          initial={{ opacity: 0, y: -22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
          <div
            className="flex items-center gap-2 px-5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-[0.28em]"
            style={{
              backgroundColor: '#fbbf2420',
              color: '#fbbf24',
              border: '1px solid #fbbf2450',
            }}
          >
            <Trophy size={11} />
            Chaos Dominated
          </div>
        </motion.div>

        {/* ── Winner name + tagline ──────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 text-center px-4 pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }}
        >
          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none tracking-tight"
            style={{ color: winColor }}
          >
            {winner?.name ?? 'Draw'}
          </h1>
          {winner && (
            <p className="text-gray-500 text-xs mt-2 italic tracking-wide">
              &ldquo;{winner.tagline}&rdquo;
            </p>
          )}
        </motion.div>

        {/* ── Winner character card — fills remaining space ────────── */}
        {winner && (
          <motion.div
            className="flex-1 flex items-end justify-center px-4 min-h-0"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width:       'min(78vw, 290px)',
                aspectRatio: '2 / 3',
                border:      `2px solid ${winColor}50`,
                boxShadow:   `0 0 60px ${winColor}30, 0 0 120px ${winColor}12`,
              }}
            >
              <CharacterImage
                src={winner.assets.victory}
                alt={`${winner.name} victory`}
                {...CHARACTER_ALIGNMENT[winner.id]}
                sizes="(max-width: 640px) 78vw, 290px"
                priority
              />
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ boxShadow: `inset 0 0 40px ${winColor}16` }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Stats + loser row ──────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 px-4 pt-4 pb-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.85, ease: 'easeOut' }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border:          '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            <div className="grid grid-cols-2">
              <div className="flex flex-col items-center py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1 text-gray-600 mb-1.5">
                  <Clock size={10} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Time</span>
                </div>
                <span className="text-white font-black text-base tabular-nums">{fmtTime(time)}</span>
              </div>
              <div className="flex flex-col items-center py-3">
                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-1.5">Coins</span>
                <span className="text-yellow-400 font-black text-base">💰 {winnerCoins}</span>
              </div>
            </div>

            {loser && (
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-gray-600 text-xs">
                  Nice try,{' '}
                  <span className="text-gray-400 font-bold">{loser.name}</span>
                  {loserCoins > 0 && <span className="text-gray-600"> · 💰 {loserCoins}</span>}
                </span>
                <span className="text-gray-600 text-xs">🙃</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Action buttons ─────────────────────────────────────── */}
        <motion.div
          className="flex-shrink-0 px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1, ease: 'easeOut' }}
        >
          <div className="flex gap-3">
            <button
              onClick={onBackToLobby}
              className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15 hover:bg-white/8 transition-colors"
              style={{ height: '58px', paddingInline: '22px' }}
            >
              <ArrowLeft size={15} />
              Lobby
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

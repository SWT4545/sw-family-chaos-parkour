'use client'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface Props {
  winner: Character | null
  loser:  Character | null
  time:   number
  onPlayAgain:   () => void
  onBackToLobby: () => void
}

export function VictoryScreen({ winner, loser, time, onPlayAgain, onBackToLobby }: Props) {
  const winColor = winner?.color ?? '#eab308'

  return (
    <div className="relative h-dvh bg-[#050508] flex items-center justify-center overflow-hidden">
      {/* Cover bg — blurred */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(22px)',
          transform: 'scale(1.06)',
        }}
      />

      {/* Winner color glow */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${winColor}1a 0%, transparent 65%)` }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-5 max-w-md w-full">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-yellow-400"
        >
          <Trophy size={38} className="text-black" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <p className="text-[10px] uppercase tracking-[0.45em] text-yellow-500 font-bold mb-1">
            CHAOS DOMINATED!
          </p>
          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none"
            style={{ color: winColor }}
          >
            {winner?.name ?? 'Draw'}
          </h1>
          {winner && (
            <p className="text-gray-500 text-xs mt-2 italic">
              &ldquo;{winner.tagline}&rdquo;
            </p>
          )}
        </motion.div>

        {/* Winner victory art */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="relative w-36 h-48 rounded-2xl border-2 overflow-hidden"
            style={{
              borderColor: winColor,
              boxShadow: `0 0 32px ${winColor}55`,
            }}
          >
            <CharacterImage
              src={winner.assets.victory}
              alt={`${winner.name} victory`}
              {...CHARACTER_ALIGNMENT[winner.id]}
              sizes="144px"
              priority
            />
          </motion.div>
        )}

        {/* Finish time */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="text-gray-600 text-xs"
        >
          Finish Time&nbsp;
          <span className="text-white font-black text-xl tabular-nums">{fmtTime(time)}</span>
        </motion.p>

        {/* Loser message */}
        {loser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl px-5 py-2.5 border border-white/8 bg-white/[0.03]"
          >
            <p className="text-gray-500 text-sm">
              Nice Try,&nbsp;
              <span className="text-gray-300 font-bold">{loser.name}</span>&nbsp;🙃
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex gap-3 w-full"
        >
          <button
            onClick={onBackToLobby}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={14} />
            Lobby
          </button>

          <motion.button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base uppercase tracking-widest text-black bg-yellow-400"
            whileHover={{ scale: 1.02, backgroundColor: '#fbbf24' }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw size={15} />
            Play Again
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

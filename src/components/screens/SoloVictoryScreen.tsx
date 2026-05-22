'use client'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, Home, Clock, Star } from 'lucide-react'
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

interface Props {
  player:    Character
  time:      number
  coins:     number
  onPlayAgain:   () => void
  onBackToMenu:  () => void
}

export function SoloVictoryScreen({ player, time, coins, onPlayAgain, onBackToMenu }: Props) {
  const didFinish = time < MATCH_SECS - 0.5
  const profile   = LocalProfiles.getByCharacter(player.id)
  const bestTime  = profile?.bestSoloTime ?? null
  const isNewBest = didFinish && (bestTime === null || time < bestTime)

  return (
    <div className="relative h-dvh bg-[#050508] flex items-center justify-center overflow-hidden">
      {/* Blurred bg */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(22px)', transform: 'scale(1.06)',
        }}
      />
      {/* Glow */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${player.color}18 0%, transparent 65%)` }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-4 max-w-sm w-full">

        {/* Trophy / skull */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: didFinish ? '#fbbf24' : '#374151' }}
        >
          {didFinish
            ? <Trophy size={38} className="text-black" />
            : <Clock  size={38} className="text-gray-300" />}
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p className="text-[10px] uppercase tracking-[0.45em] text-yellow-500 font-bold mb-1">
            {didFinish ? 'Run Complete!' : "Time's Up!"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none" style={{ color: player.color }}>
            {player.name}
          </h1>
          {isNewBest && (
            <motion.p
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="text-yellow-400 font-black text-sm mt-1.5 uppercase tracking-widest"
            >
              ⭐ New Best Time!
            </motion.p>
          )}
        </motion.div>

        {/* Victory art */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="relative w-32 h-44 rounded-2xl border-2 overflow-hidden"
          style={{ borderColor: player.color, boxShadow: `0 0 28px ${player.color}50` }}
        >
          <CharacterImage
            src={player.assets.victory}
            alt={`${player.name} victory`}
            {...CHARACTER_ALIGNMENT[player.id]}
            sizes="128px"
            priority
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="w-full grid grid-cols-3 gap-2"
        >
          {[
            { label: 'Finish Time', value: fmtTime(time), icon: <Clock size={12} /> },
            { label: 'Coins',       value: String(coins),  icon: '💰' },
            { label: 'Best Time',   value: bestTime !== null ? fmtTime(bestTime) : '—', icon: <Star size={12} /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/8">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                {typeof stat.icon === 'string' ? stat.icon : stat.icon}
                <span className="text-[9px] uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="font-black text-white text-base tabular-nums">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="flex gap-3 w-full"
        >
          <button
            onClick={onBackToMenu}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm uppercase tracking-wider text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            <Home size={14} />
            Menu
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

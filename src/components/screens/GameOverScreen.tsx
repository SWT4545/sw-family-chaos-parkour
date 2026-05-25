'use client'
import { motion } from 'framer-motion'
import { RotateCcw, Map, Home, Heart } from 'lucide-react'
import type { Character } from '@/types/player'

interface Props {
  player:            Character
  levelTitle:        string
  livesUsed:         number
  onRetry:           () => void
  onWorldMap:        () => void
  onMainMenu:        () => void
  onChangeCharacter?: () => void
}

export function GameOverScreen({ player, levelTitle, livesUsed, onRetry, onWorldMap, onMainMenu, onChangeCharacter }: Props) {
  const col = player.color

  return (
    <div className="relative h-dvh overflow-hidden flex flex-col items-center justify-center"
      style={{ backgroundColor: '#02020C' }}>

      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, #ef444418 0%, transparent 70%)` }} />

      {/* Pulse rings */}
      {[0, 0.25, 0.5].map((delay, i) => (
        <motion.div key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ border: '2px solid #ef4444', width: 60, height: 60 }}
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 8, opacity: 0 }}
          transition={{ duration: 1.8, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.2 }}
        />
      ))}

      {/* Heart icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 z-10"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}>
          <Heart size={36} className="text-red-400 fill-red-400" />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center z-10 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
      >
        <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-red-500 mb-1">
          Out of Lives
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-2"
          style={{ textShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
          Game Over
        </h1>
        <p className="text-gray-400 text-sm font-medium">
          {levelTitle}
        </p>
        {livesUsed > 0 && (
          <p className="text-gray-600 text-xs mt-1">
            {livesUsed === 1 ? '1 life lost' : `${livesUsed} lives lost`}
          </p>
        )}
      </motion.div>

      {/* Character name */}
      <motion.p
        className="text-xs font-bold uppercase tracking-widest mt-3 z-10"
        style={{ color: `${col}80` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {player.name} fell
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-3 px-6 w-full max-w-xs mt-8 z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        {/* Retry — primary */}
        <motion.button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest"
          style={{ height: 58, background: col, color: '#000' }}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw size={18} /> Try Again
        </motion.button>

        {/* World Map */}
        <button
          onClick={onWorldMap}
          className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider border border-white/15 text-white"
          style={{ height: 50 }}
        >
          <Map size={14} /> World Map
        </button>

        {/* Change Character */}
        {onChangeCharacter && (
          <button
            onClick={onChangeCharacter}
            className="flex items-center justify-center gap-2 rounded-xl font-semibold text-xs uppercase tracking-wider border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            style={{ height: 42 }}
          >
            Change Character
          </button>
        )}

        {/* Main Menu */}
        <button
          onClick={onMainMenu}
          className="flex items-center justify-center gap-2 rounded-xl font-semibold text-xs uppercase tracking-wider text-gray-500"
          style={{ height: 38 }}
        >
          <Home size={12} /> Main Menu
        </button>
      </motion.div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Zap } from 'lucide-react'
import { CharacterCard } from './CharacterCard'
import { CHARACTERS } from '@/lib/game/characters/characters'
import { Character } from '@/types/player'

interface CharacterSelectProps {
  playerNumber?: 1 | 2
  onSelect: (character: Character) => void
  onBack: () => void
}

export function CharacterSelect({ playerNumber = 1, onSelect, onBack }: CharacterSelectProps) {
  const [focused, setFocused] = useState<Character>(CHARACTERS[0])

  return (
    <div className="relative min-h-screen bg-[#080808] flex flex-col overflow-hidden">
      {/* Blurred poster bg */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(16px)',
          transform: 'scale(1.05)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold">
            {playerNumber === 2 ? 'Player 2 — S&W Family Chaos Parkour' : 'S&W Family Chaos Parkour'}
          </p>
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">
            {playerNumber === 2 ? 'Player 2 — Choose' : 'Choose Your Champion'}
          </h1>
        </div>

        <div className="w-16 sm:w-24" />
      </div>

      {/* Cards + detail */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
        {/* Character cards */}
        <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
          {CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              selected={focused.id === char.id}
              onSelect={() => setFocused(char)}
              size="lg"
            />
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={focused.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-xl"
          >
            <div
              className="rounded-2xl border p-5 backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(10,10,10,0.88)',
                borderColor: `${focused.color}30`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                {/* Name + quote */}
                <div className="min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-widest font-bold mb-0.5"
                    style={{ color: focused.color }}
                  >
                    {focused.role}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-none">
                    {focused.name}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1.5 italic leading-snug">
                    &ldquo;{focused.tagline}&rdquo;
                  </p>
                </div>

                {/* Ability badge */}
                <div
                  className="flex-shrink-0 rounded-xl px-4 py-3 text-right"
                  style={{
                    backgroundColor: `${focused.color}12`,
                    border: `1px solid ${focused.color}35`,
                  }}
                >
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Zap size={10} style={{ color: focused.color }} />
                    <span
                      className="text-[9px] uppercase tracking-wider font-bold"
                      style={{ color: focused.color }}
                    >
                      Special Ability
                    </span>
                  </div>
                  <p className="text-white font-black text-xs sm:text-sm uppercase">
                    {focused.ability}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-1 max-w-[160px] sm:max-w-[200px] leading-snug">
                    {focused.abilityDesc}
                  </p>
                </div>
              </div>

              {/* Select CTA */}
              <motion.button
                onClick={() => onSelect(focused)}
                className="w-full py-3.5 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest text-black"
                style={{ backgroundColor: '#eab308' }}
                whileHover={{ scale: 1.02, backgroundColor: '#fbbf24' }}
                whileTap={{ scale: 0.97 }}
              >
                SELECT {focused.name.toUpperCase()} →
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

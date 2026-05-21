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
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >
      {/* Blurred poster bg */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:   'url(/family-chaos-poster.png)',
          backgroundSize:    'cover',
          backgroundPosition:'center',
          filter:            'blur(16px)',
          transform:         'scale(1.05)',
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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold leading-none">
            {playerNumber === 2 ? 'Player 2 — S&W Family Chaos Parkour' : 'S&W Family Chaos Parkour'}
          </p>
          <h1 className="text-base sm:text-2xl font-black uppercase tracking-widest text-white leading-tight mt-0.5">
            {playerNumber === 2 ? 'Player 2 — Choose' : 'Choose Your Champion'}
          </h1>
        </div>

        <div className="w-16 sm:w-24" />
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div
          className="flex flex-col items-center px-4 pt-3 pb-8 gap-6
                     sm:justify-center sm:min-h-full"
        >
          {/* Character cards
              Mobile:  2-column grid — wrapper div owns the aspect ratio,
                       card fills it with sizeClassName="w-full h-full"
              Desktop: flex row — wrapper div has explicit fixed dimensions,
                       card fills those via sizeClassName="w-full h-full" too */}
          <div className="grid grid-cols-2 sm:flex gap-4 sm:flex-wrap sm:justify-center w-full sm:w-auto">
            {CHARACTERS.map((char) => (
              <div
                key={char.id}
                className="aspect-[2/3] sm:aspect-auto sm:w-44 sm:h-60 md:w-48 md:h-64 sm:flex-shrink-0"
              >
                <CharacterCard
                  character={char}
                  selected={focused.id === char.id}
                  onSelect={() => setFocused(char)}
                  size="lg"
                  sizeClassName="w-full h-full"
                />
              </div>
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
                  borderColor:     `${focused.color}30`,
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
                      border:          `1px solid ${focused.color}35`,
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
    </div>
  )
}

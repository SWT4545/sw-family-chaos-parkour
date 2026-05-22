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
  // No pre-selection — user must explicitly tap a card before SELECT activates
  const [focused, setFocused] = useState<Character | null>(null)

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Blurred poster bg */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:    'url(/family-chaos-poster.png)',
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          filter:             'blur(16px)',
          transform:          'scale(1.05)',
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
            {playerNumber === 2 ? 'Player 2' : 'S&W Family Chaos Parkour'}
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
          className="flex flex-col items-center px-4 pt-3 sm:justify-center sm:min-h-full"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}
        >

          {/* Character card grid — 2-col mobile, flex row desktop */}
          <div
            className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center w-full sm:w-auto"
            style={{ gap: '18px', paddingBottom: '28px' }}
          >
            {CHARACTERS.map((char) => (
              <div
                key={char.id}
                className="aspect-[2/3] sm:aspect-auto sm:w-44 sm:h-60 md:w-48 md:h-64 sm:flex-shrink-0"
              >
                <CharacterCard
                  character={char}
                  selected={focused?.id === char.id}
                  onSelect={() => setFocused(char)}
                  size="lg"
                  sizeClassName="w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* ── Prompt until a card is tapped ── */}
          {!focused && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 text-sm text-center mt-8 uppercase tracking-widest"
            >
              Tap a character to see their stats
            </motion.p>
          )}

          {/* ── Detail panel — only shown after a card is tapped ── */}
          <AnimatePresence mode="wait">
            {focused && (
            <motion.div
              key={focused.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-xl"
              style={{ marginTop: '28px' }}
            >
              <div
                className="rounded-2xl border backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(10,10,10,0.88)',
                  borderColor:     `${focused.color}30`,
                  padding:         '24px',
                }}
              >
                {/* Role + Name + Quote */}
                <div className="mb-4">
                  <p
                    className="text-[11px] uppercase tracking-widest font-bold mb-1"
                    style={{ color: focused.color }}
                  >
                    {focused.role}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-white leading-none">
                    {focused.name}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 italic leading-snug">
                    &ldquo;{focused.tagline}&rdquo;
                  </p>
                </div>

                {/* Special Ability box */}
                <div
                  className="w-full rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: `${focused.color}12`,
                    border:          `1px solid ${focused.color}35`,
                    marginTop:       '16px',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap size={12} style={{ color: focused.color }} />
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold"
                      style={{ color: focused.color }}
                    >
                      Special Ability
                    </span>
                  </div>
                  <p className="text-white font-black text-sm sm:text-base uppercase">
                    {focused.ability}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 leading-snug">
                    {focused.abilityDesc}
                  </p>
                </div>

                {/* Select button — only enabled after tapping a card */}
                <motion.button
                  onClick={() => onSelect(focused)}
                  className="w-full rounded-xl font-black text-base uppercase tracking-widest text-black flex items-center justify-center"
                  style={{
                    backgroundColor: '#eab308',
                    height:          '60px',
                    marginTop:       '24px',
                  }}
                  whileHover={{ scale: 1.02, backgroundColor: '#fbbf24' }}
                  whileTap={{ scale: 0.97 }}
                >
                  PLAY AS {focused.name.toUpperCase()} →
                </motion.button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}

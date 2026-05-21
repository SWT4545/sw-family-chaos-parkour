'use client'
import { motion } from 'framer-motion'
import { Character } from '@/types/player'
import { cn } from '@/lib/utils'

interface CharacterCardProps {
  character: Character
  selected: boolean
  onSelect: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-32 h-44',
  md: 'w-40 h-56',
  lg: 'w-48 h-64 sm:w-52 sm:h-72',
}

export function CharacterCard({ character, selected, onSelect, size = 'md' }: CharacterCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 cursor-pointer focus:outline-none flex-shrink-0',
        selected ? 'border-yellow-400' : 'border-gray-700 hover:border-gray-500'
      )}
      style={
        selected
          ? { boxShadow: `0 0 28px ${character.color}70, 0 0 56px ${character.color}30` }
          : undefined
      }
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      {/* Portrait crop from character sheet */}
      <div
        className={cn('bg-no-repeat', sizes[size])}
        style={{
          backgroundImage: 'url(/family-chaos-character-sheet.png)',
          backgroundSize: '500% auto',
          backgroundPosition: `${character.bgX} ${character.bgY}`,
        }}
      />

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

      {/* Inner glow on selected */}
      {selected && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 24px ${character.color}30` }}
        />
      )}

      {/* Character name plate */}
      <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
        <p
          className="text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5"
          style={{ color: character.color }}
        >
          {character.role}
        </p>
        <h3 className="font-black text-white text-sm uppercase leading-tight">
          {character.name}
        </h3>
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
          <span className="text-black text-[10px] font-black">✓</span>
        </div>
      )}
    </motion.button>
  )
}

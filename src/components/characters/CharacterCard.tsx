'use client'
import { motion } from 'framer-motion'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'
import { cn } from '@/lib/utils'

interface CharacterCardProps {
  character: Character
  selected:  boolean
  onSelect:  () => void
  size?:     'sm' | 'md' | 'lg'
  /** Replaces built-in size classes — use when a parent controls dimensions */
  sizeClassName?: string
}

const sizes = {
  sm: 'w-24 h-36 sm:w-32 sm:h-44',
  md: 'w-32 h-44 sm:w-40 sm:h-56',
  lg: 'w-36 h-52 sm:w-44 sm:h-60 md:w-48 md:h-64',
}

export function CharacterCard({ character, selected, onSelect, size = 'md', sizeClassName }: CharacterCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      aria-label={`Select ${character.name}`}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 cursor-pointer focus:outline-none flex-shrink-0',
        sizeClassName ?? sizes[size],
        selected ? 'border-yellow-400' : 'border-gray-700 hover:border-gray-500'
      )}
      style={selected ? { boxShadow: `0 0 28px ${character.color}70, 0 0 56px ${character.color}30` } : undefined}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      {/* Card image — fills the entire button, no text overlaid */}
      <CharacterImage
        src={character.assets.card}
        alt={character.name}
        {...CHARACTER_ALIGNMENT[character.id]}
        sizes="(max-width: 640px) 160px, 220px"
        priority={selected}
      />

      {/* Selected inner glow */}
      {selected && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 24px ${character.color}30` }}
        />
      )}

      {/* Selected checkmark badge */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
          <span className="text-black text-xs font-black leading-none">✓</span>
        </div>
      )}
    </motion.button>
  )
}

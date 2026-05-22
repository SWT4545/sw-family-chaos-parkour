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
        selected ? 'border-yellow-400' : 'border-gray-800 hover:border-gray-600'
      )}
      style={selected
        ? { boxShadow: `0 0 32px ${character.color}80, 0 0 64px ${character.color}35, inset 0 0 28px ${character.color}20` }
        : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }
      }
      whileHover={{ scale: 1.04, y: -5 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      {/* Dark vignette behind the image for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-[1] pointer-events-none" />

      {/* Card image */}
      <CharacterImage
        src={character.assets.card}
        alt={character.name}
        {...CHARACTER_ALIGNMENT[character.id]}
        sizes="(max-width: 640px) 160px, 220px"
        priority={selected}
      />

      {/* Selected pulse ring */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-[2]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: `inset 0 0 32px ${character.color}40` }}
        />
      )}

      {/* Selected checkmark badge */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg z-[3]"
        >
          <span className="text-black text-xs font-black leading-none">✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}

'use client'
import { motion } from 'framer-motion'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'
import { cn } from '@/lib/utils'

interface CharacterCardProps {
  character: Character
  selected: boolean
  onSelect: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-24 h-36 sm:w-32 sm:h-44',
  md: 'w-32 h-44 sm:w-40 sm:h-56',
  lg: 'w-36 h-52 sm:w-44 sm:h-60 md:w-48 md:h-64',
}

export function CharacterCard({ character, selected, onSelect, size = 'md' }: CharacterCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 cursor-pointer focus:outline-none flex-shrink-0',
        sizes[size],
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
      {/* Character card art — aligned via registry */}
      <CharacterImage
        src={character.assets.card}
        alt={character.name}
        {...CHARACTER_ALIGNMENT[character.id]}
        sizes="(max-width: 640px) 144px, 192px"
        priority={selected}
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

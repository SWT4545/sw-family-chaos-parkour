'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Map, Users, Zap } from 'lucide-react'
import { Character } from '@/types/player'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

const MAPS = [
  { id: 'rooftop', name: 'Rooftop Mayhem', desc: 'Urban skyline chaos' },
  { id: 'warehouse', name: 'Warehouse Wipeout', desc: 'Industrial obstacle course' },
  { id: 'park', name: 'Park Pandemonium', desc: 'Suburban trap gauntlet' },
]

interface FamilyLobbyProps {
  player1: Character
  player2?: Character | null
  onStartMatch: () => void
  onSelectP2?: () => void
  onBack: () => void
}

function CharacterPortrait({ character }: { character: Character }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-44 sm:w-40 sm:h-56 rounded-xl overflow-hidden">
        <CharacterImage
          src={character.assets.full}
          alt={character.name}
          {...CHARACTER_ALIGNMENT[character.id]}
          sizes="(max-width: 640px) 128px, 160px"
        />
      </div>
      <div className="text-center">
        <p
          className="text-[10px] uppercase tracking-widest font-bold"
          style={{ color: character.color }}
        >
          {character.role}
        </p>
        <h3 className="font-black text-white text-base uppercase leading-tight">
          {character.name}
        </h3>
        <div className="flex items-center gap-1 justify-center mt-1">
          <Zap size={9} style={{ color: character.color }} />
          <span className="text-[10px] font-semibold" style={{ color: character.color }}>
            {character.ability}
          </span>
        </div>
      </div>
    </div>
  )
}

export function FamilyLobby({ player1, player2, onStartMatch, onSelectP2, onBack }: FamilyLobbyProps) {
  const [mapIndex, setMapIndex] = useState(0)
  const map = MAPS[mapIndex]

  return (
    <div className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
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
            S&W Family Chaos Parkour
          </p>
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">
            Match Lobby
          </h1>
        </div>

        <div className="w-16 sm:w-24" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-5 pb-8">

        {/* Players row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 w-full max-w-2xl">

          {/* Player 1 */}
          <div
            className="w-full sm:flex-1 rounded-2xl p-4 backdrop-blur-sm border text-center"
            style={{
              backgroundColor: 'rgba(10,10,10,0.85)',
              borderColor: `${player1.color}30`,
            }}
          >
            <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-3">
              Player 1
            </p>
            <CharacterPortrait character={player1} />
          </div>

          {/* VS */}
          <div className="flex-shrink-0 flex flex-row sm:flex-col items-center gap-2">
            <div className="hidden sm:block w-px h-6 bg-gray-700" />
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-red-600 border-4 border-red-400/50 flex items-center justify-center">
              <span className="font-black text-white text-xs sm:text-xl leading-none">VS</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-700" />
          </div>

          {/* Player 2 */}
          {player2 ? (
            <div
              className="w-full sm:flex-1 rounded-2xl p-4 backdrop-blur-sm border text-center"
              style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                borderColor: `${player2.color}30`,
              }}
            >
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3">
                Player 2
              </p>
              <CharacterPortrait character={player2} />
            </div>
          ) : (
            <div
              className="w-full sm:flex-1 rounded-2xl p-4 backdrop-blur-sm border border-dashed border-gray-700/40 text-center"
              style={{ backgroundColor: 'rgba(10,10,10,0.6)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-3">
                Player 2
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-xl bg-gray-800/40 flex items-center justify-center overflow-hidden">
                  <Users size={32} className="text-gray-600" />
                </div>
                {onSelectP2 && (
                  <button
                    onClick={onSelectP2}
                    className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold border border-yellow-500/30 rounded-lg px-3 py-1.5 hover:bg-yellow-500/10 transition-colors pointer-events-auto"
                  >
                    + Choose Character
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map picker */}
        <div
          className="w-full max-w-2xl rounded-2xl p-4 sm:p-5 backdrop-blur-sm border border-white/[0.06]"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map size={14} className="text-yellow-500" />
              <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">
                Map Selection
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
              Match Duration&nbsp;·&nbsp;<span className="text-gray-400">8:00</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMapIndex((i) => (i - 1 + MAPS.length) % MAPS.length)}
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center">
              <motion.div
                key={map.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <h3 className="font-black text-white text-lg sm:text-xl uppercase">{map.name}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{map.desc}</p>
              </motion.div>
            </div>
            <button
              onClick={() => setMapIndex((i) => (i + 1) % MAPS.length)}
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Start match */}
        <motion.button
          onClick={onStartMatch}
          className="w-full max-w-2xl py-4 rounded-2xl font-black text-base sm:text-xl uppercase tracking-widest text-black bg-yellow-400"
          whileHover={{ scale: 1.02, backgroundColor: '#fbbf24' }}
          whileTap={{ scale: 0.97 }}
        >
          START MATCH ▶
        </motion.button>
      </div>
    </div>
  )
}

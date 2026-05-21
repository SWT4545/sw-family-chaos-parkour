'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MainMenu } from '@/components/MainMenu'
import { CharacterSelect } from '@/components/characters/CharacterSelect'
import { FamilyLobby } from '@/components/lobby/FamilyLobby'
import { Character, GameScreen } from '@/types/player'

const slide = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.015 },
  transition: { duration: 0.22, ease: 'easeInOut' as const },
}

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('main-menu')
  const [player1, setPlayer1] = useState<Character | null>(null)

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'main-menu' && (
          <motion.div key="main-menu" {...slide}>
            <MainMenu onPlay={() => setScreen('character-select')} />
          </motion.div>
        )}

        {screen === 'character-select' && (
          <motion.div key="character-select" {...slide}>
            <CharacterSelect
              onSelect={(char) => {
                setPlayer1(char)
                setScreen('lobby')
              }}
              onBack={() => setScreen('main-menu')}
            />
          </motion.div>
        )}

        {screen === 'lobby' && player1 && (
          <motion.div key="lobby" {...slide}>
            <FamilyLobby
              player1={player1}
              onStartMatch={() => setScreen('main-menu')}
              onBack={() => setScreen('character-select')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

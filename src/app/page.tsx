'use client'
import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MainMenu } from '@/components/MainMenu'
import { CharacterSelect } from '@/components/characters/CharacterSelect'
import { FamilyLobby } from '@/components/lobby/FamilyLobby'
import { GameCanvas } from '@/components/game/GameCanvas'
import { GameHUD } from '@/components/hud/GameHUD'
import { VictoryScreen } from '@/components/screens/VictoryScreen'
import { Character, GameScreen } from '@/types/player'

const slide = {
  initial:    { opacity: 0, scale: 0.98 },
  animate:    { opacity: 1, scale: 1 },
  exit:       { opacity: 0, scale: 1.015 },
  transition: { duration: 0.22, ease: 'easeInOut' as const },
}

export default function Home() {
  const [screen,         setScreen]        = useState<GameScreen>('main-menu')
  const [selectingFor,   setSelectingFor]  = useState<1 | 2>(1)
  const [player1,        setPlayer1]       = useState<Character | null>(null)
  const [player2,        setPlayer2]       = useState<Character | null>(null)
  const [matchStartTime, setMatchStart]    = useState(0)
  const [victoryData,    setVictoryData]   = useState<{ winnerId: 1 | 2; time: number } | null>(null)

  function handleCharSelect(char: Character) {
    if (selectingFor === 1) { setPlayer1(char); setScreen('lobby') }
    else                    { setPlayer2(char); setScreen('lobby') }
  }

  const handleVictory = useCallback((winnerId: 1 | 2, time: number) => {
    setVictoryData({ winnerId, time })
    setScreen('victory')
  }, [])

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── Main Menu ── */}
        {screen === 'main-menu' && (
          <motion.div key="main-menu" {...slide}>
            <MainMenu
              onPlay={() => {
                setSelectingFor(1)
                setScreen('character-select')
              }}
            />
          </motion.div>
        )}

        {/* ── Character Select (P1 or P2) ── */}
        {screen === 'character-select' && (
          <motion.div key={`cs-p${selectingFor}`} {...slide}>
            <CharacterSelect
              playerNumber={selectingFor}
              onSelect={handleCharSelect}
              onBack={() => setScreen(selectingFor === 1 ? 'main-menu' : 'lobby')}
            />
          </motion.div>
        )}

        {/* ── Lobby ── */}
        {screen === 'lobby' && player1 && (
          <motion.div key="lobby" {...slide}>
            <FamilyLobby
              player1={player1}
              player2={player2}
              onSelectP2={() => { setSelectingFor(2); setScreen('character-select') }}
              onStartMatch={() => {
                setMatchStart(Date.now())
                setScreen('game')
              }}
              onBack={() => setScreen('character-select')}
            />
          </motion.div>
        )}

        {/* ── Game ── */}
        {screen === 'game' && player1 && (
          <motion.div
            key="game"
            {...slide}
            className="relative min-h-screen bg-[#060610] flex items-center justify-center"
          >
            <div className="relative w-full max-w-[960px] aspect-video">
              <GameCanvas
                player1={player1}
                player2={player2}
                matchStartTime={matchStartTime}
                onVictory={handleVictory}
              />
              <GameHUD
                player1={player1}
                player2={player2}
                matchStartTime={matchStartTime}
              />
            </div>
          </motion.div>
        )}

        {/* ── Victory ── */}
        {screen === 'victory' && victoryData && (
          <motion.div key="victory" {...slide}>
            <VictoryScreen
              winner={victoryData.winnerId === 1 ? player1 : player2}
              loser={victoryData.winnerId === 1 ? player2 : player1}
              time={victoryData.time}
              onPlayAgain={() => setScreen('lobby')}
              onBackToLobby={() => setScreen('lobby')}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

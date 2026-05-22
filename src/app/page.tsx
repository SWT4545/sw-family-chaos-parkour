'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { preloadGameAssets } from '@/lib/game/assets/preloadAssets'
import { MusicManager } from '@/lib/game/audio/MusicManager'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'
import { DailyChallenges } from '@/lib/profiles/DailyChallenges'
import { MainMenu } from '@/components/MainMenu'
import { ModeSelect } from '@/components/screens/ModeSelect'
import { CharacterSelect } from '@/components/characters/CharacterSelect'
import { FamilyLobby } from '@/components/lobby/FamilyLobby'
import { GameCanvas } from '@/components/game/GameCanvas'
import { GameHUD } from '@/components/hud/GameHUD'
import { TrapHUD } from '@/components/game/TrapHUD'
import { TouchControls } from '@/components/game/TouchControls'
import { VictoryScreen } from '@/components/screens/VictoryScreen'
import { SoloVictoryScreen } from '@/components/screens/SoloVictoryScreen'
import { Leaderboard } from '@/components/screens/Leaderboard'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { DailyChallengesPanel } from '@/components/screens/DailyChallenges'
import { Character, GameScreen, GameMode } from '@/types/player'
import { ChaosState, defaultChaosState } from '@/types/chaos'

const slide = {
  initial:    { opacity: 0, scale: 0.98 },
  animate:    { opacity: 1, scale: 1 },
  exit:       { opacity: 0, scale: 1.015 },
  transition: { duration: 0.22, ease: 'easeInOut' as const },
}

interface VictoryData {
  winnerId: 1 | 2
  time:     number
  coins:    { p1: number; p2: number }
}

export default function Home() {
  const [screen,         setScreen]        = useState<GameScreen>('main-menu')
  const [gameMode,       setGameMode]      = useState<GameMode>('solo')
  const [selectingFor,   setSelectingFor]  = useState<1 | 2>(1)
  const [player1,        setPlayer1]       = useState<Character | null>(null)
  const [player2,        setPlayer2]       = useState<Character | null>(null)
  const [matchStartTime, setMatchStart]    = useState(0)
  const [victoryData,    setVictoryData]   = useState<VictoryData | null>(null)
  const [settingsOpen,   setSettingsOpen]  = useState(false)
  const [dailyOpen,      setDailyOpen]     = useState(false)

  // Shared chaos state — GameCanvas writes, TrapHUD + GameHUD poll
  const chaosRef = useRef<ChaosState>(defaultChaosState())

  useEffect(() => { preloadGameAssets() }, [])

  // Play matching music track when screen changes
  useEffect(() => { MusicManager.playScreen(screen) }, [screen])

  // ── Character select handler ─────────────────────────────────────
  function handleCharSelect(char: Character) {
    if (selectingFor === 1) {
      setPlayer1(char)
      if (gameMode === '1v1') {
        // Immediately show P2 character select
        setSelectingFor(2)
        // screen stays on 'character-select' — key change forces remount
      } else {
        // Solo — go straight to lobby
        setScreen('lobby')
      }
    } else {
      // P2 done — go to lobby
      setPlayer2(char)
      setScreen('lobby')
    }
  }

  // Back button from character select
  function handleCharSelectBack() {
    if (selectingFor === 1) {
      setScreen('mode-select')
    } else {
      // P2 back → return to P1 select
      setSelectingFor(1)
      setPlayer2(null)
    }
  }

  // ── Victory handler ──────────────────────────────────────────────
  const handleVictory = useCallback((
    winnerId: 1 | 2,
    time: number,
    coins: { p1: number; p2: number },
  ) => {
    setVictoryData({ winnerId, time, coins })

    // Update local profiles
    if (gameMode === 'solo' && player1) {
      LocalProfiles.recordSoloRun(player1.id, time, coins.p1)
    } else if (gameMode === '1v1' && player1 && player2) {
      LocalProfiles.recordMatch(player1.id, player2.id, winnerId, coins.p1, coins.p2)
    }

    // Daily challenge progress
    DailyChallenges.onMatchComplete({
      mode:             gameMode === 'solo' ? 'solo' : '1v1',
      coinsCollected:   winnerId === 1 ? coins.p1 : coins.p2,
      powerupsUsed:     0,
      survivedTacoRain: false,
    })

    setScreen(gameMode === 'solo' ? 'solo-victory' : 'victory')
  }, [gameMode, player1, player2])

  // ── Reset for new game ───────────────────────────────────────────
  function startNewGame() {
    chaosRef.current = defaultChaosState()
    setMatchStart(Date.now())
    setScreen('game')
  }

  return (
    <div className="h-dvh bg-black overflow-hidden">

      {/* Settings overlay — lives outside AnimatePresence so it persists across screens */}
      <SettingsPanel      open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DailyChallengesPanel open={dailyOpen}  onClose={() => setDailyOpen(false)} />

      <AnimatePresence mode="wait">

        {/* ── Main Menu ── */}
        {screen === 'main-menu' && (
          <motion.div key="main-menu" {...slide}>
            <MainMenu
              onPlay={() => setScreen('mode-select')}
              onLeaderboard={() => setScreen('leaderboard')}
              onDailyChallenges={() => setDailyOpen(true)}
              onSettings={() => setSettingsOpen(true)}
            />
          </motion.div>
        )}

        {/* ── Mode Select ── */}
        {screen === 'mode-select' && (
          <motion.div key="mode-select" {...slide}>
            <ModeSelect
              onSelect={(mode) => {
                setGameMode(mode)
                setPlayer1(null)
                setPlayer2(null)
                setSelectingFor(1)
                setScreen('character-select')
              }}
              onBack={() => setScreen('main-menu')}
            />
          </motion.div>
        )}

        {/* ── Character Select (P1 then P2 for 1v1) ── */}
        {screen === 'character-select' && (
          <motion.div key={`cs-p${selectingFor}-${gameMode}`} {...slide}>
            <CharacterSelect
              playerNumber={selectingFor}
              onSelect={handleCharSelect}
              onBack={handleCharSelectBack}
            />
          </motion.div>
        )}

        {/* ── Lobby ── */}
        {screen === 'lobby' && player1 && (
          <motion.div key="lobby" {...slide}>
            <FamilyLobby
              player1={player1}
              player2={player2}
              mode={gameMode === 'solo' ? 'solo' : '1v1'}
              onStartMatch={startNewGame}
              onBack={() => {
                if (gameMode === '1v1') {
                  // Back to P2 select in 1v1
                  setSelectingFor(2)
                  setScreen('character-select')
                } else {
                  setSelectingFor(1)
                  setScreen('character-select')
                }
              }}
            />
          </motion.div>
        )}

        {/* ── Game ── */}
        {screen === 'game' && player1 && (
          <motion.div
            key="game"
            {...slide}
            className="relative h-dvh bg-[#060610] flex items-center justify-center"
          >
            <div className="relative w-full max-w-[960px] aspect-video">
              <GameCanvas
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStartTime}
                mode={gameMode === 'solo' ? 'solo' : '1v1'}
                onVictory={handleVictory}
                chaosRef={chaosRef}
              />
              <GameHUD
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStartTime}
                chaosRef={chaosRef}
                mode={gameMode === 'solo' ? 'solo' : '1v1'}
              />
              {gameMode === '1v1' && (
                <TrapHUD
                  player1={player1}
                  player2={player2}
                  chaosRef={chaosRef}
                />
              )}
              <TouchControls />
            </div>
          </motion.div>
        )}

        {/* ── 1v1 Victory ── */}
        {screen === 'victory' && victoryData && player1 && (
          <motion.div key="victory" {...slide}>
            <VictoryScreen
              winner={victoryData.winnerId === 1 ? player1 : player2}
              loser={victoryData.winnerId === 1 ? player2 : player1}
              time={victoryData.time}
              winnerCoins={victoryData.winnerId === 1 ? victoryData.coins.p1 : victoryData.coins.p2}
              loserCoins={victoryData.winnerId === 1 ? victoryData.coins.p2 : victoryData.coins.p1}
              onPlayAgain={() => {
                chaosRef.current = defaultChaosState()
                setMatchStart(Date.now())
                setScreen('game')
              }}
              onBackToLobby={() => setScreen('lobby')}
            />
          </motion.div>
        )}

        {/* ── Solo Victory ── */}
        {screen === 'solo-victory' && victoryData && player1 && (
          <motion.div key="solo-victory" {...slide}>
            <SoloVictoryScreen
              player={player1}
              time={victoryData.time}
              coins={victoryData.coins.p1}
              onPlayAgain={() => {
                chaosRef.current = defaultChaosState()
                setMatchStart(Date.now())
                setScreen('game')
              }}
              onBackToMenu={() => setScreen('main-menu')}
            />
          </motion.div>
        )}

        {/* ── Leaderboard ── */}
        {screen === 'leaderboard' && (
          <motion.div key="leaderboard" {...slide}>
            <Leaderboard onBack={() => setScreen('main-menu')} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

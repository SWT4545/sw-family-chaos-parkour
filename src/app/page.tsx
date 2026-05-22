'use client'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { preloadGameAssets } from '@/lib/game/assets/preloadAssets'
import { MusicManager } from '@/lib/game/audio/MusicManager'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'
import { DailyChallenges } from '@/lib/profiles/DailyChallenges'
import { SeasonService } from '@/lib/season/SeasonService'
import { CHARACTERS_LIST } from '@/lib/game/characters/CharacterRegistry'
import { useGameSync } from '@/hooks/useGameSync'
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
import { CosmeticShop } from '@/components/cosmetics/CosmeticShop'
import { SeasonPanel } from '@/components/cosmetics/SeasonPanel'
import { OnlineGateway } from '@/components/online/OnlineGateway'
import { RoomCreator } from '@/components/online/RoomCreator'
import { RoomJoiner } from '@/components/online/RoomJoiner'
import { OnlineLobby } from '@/components/online/OnlineLobby'
import { Character, GameScreen, GameMode } from '@/types/player'
import type { RoomPlayer } from '@/types/room'
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
  const [screen,       setScreen]      = useState<GameScreen>('main-menu')
  const [gameMode,     setGameMode]    = useState<GameMode>('solo')
  const [selectingFor, setSelectingFor] = useState<1 | 2>(1)
  const [player1,      setPlayer1]     = useState<Character | null>(null)
  const [player2,      setPlayer2]     = useState<Character | null>(null)
  const [matchStart,   setMatchStart]  = useState(0)
  const [victoryData,  setVictoryData] = useState<VictoryData | null>(null)

  // Overlays
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dailyOpen,    setDailyOpen]    = useState(false)
  const [shopOpen,     setShopOpen]     = useState(false)
  const [seasonOpen,   setSeasonOpen]   = useState(false)

  // Online state
  const [roomCode,        setRoomCode]        = useState<string | null>(null)
  const [onlinePlayers,   setOnlinePlayers]   = useState<RoomPlayer[]>([])
  const [playerName,      setPlayerName]      = useState('Player')
  const [onlineAction,    setOnlineAction]    = useState<'create' | 'join'>('create')

  const chaosRef = useRef<ChaosState>(defaultChaosState())

  // Build character map for online ghost lookup
  const characterMap = useMemo(() => {
    const m = new Map<string, Character>()
    CHARACTERS_LIST.forEach(c => m.set(c.id, c as unknown as Character))
    return m
  }, [])

  // Online game sync (active only during online game)
  const remotePlayers = onlinePlayers.filter(p => player1 && p.id !== player1.id)
  const { remoteGhosts, publishState } = useGameSync(
    gameMode === 'online' && screen === 'game' ? roomCode : null,
    player1?.id ?? null,
    remotePlayers,
    characterMap,
  )

  useEffect(() => { preloadGameAssets() }, [])
  useEffect(() => { MusicManager.playScreen(screen) }, [screen])

  // Set player name from profile on load
  useEffect(() => {
    const profiles = LocalProfiles.getAll()
    if (profiles.length > 0) setPlayerName(profiles[0].playerName)
  }, [])

  // ── Character select ──────────────────────────────────────────────
  function handleCharSelect(char: Character) {
    if (gameMode === 'online') {
      setPlayer1(char)
      setScreen(onlineAction === 'create' ? 'online-create' : 'online-join')
      return
    }
    if (selectingFor === 1) {
      setPlayer1(char)
      if (gameMode === '1v1') { setSelectingFor(2) } else { setScreen('lobby') }
    } else {
      setPlayer2(char); setScreen('lobby')
    }
  }

  function handleCharSelectBack() {
    if (gameMode === 'online') { setScreen('online-gateway'); return }
    if (selectingFor === 1) { setScreen('mode-select') }
    else { setSelectingFor(1); setPlayer2(null) }
  }

  // ── Online gateway ────────────────────────────────────────────────
  function handleGatewayCreate() {
    setGameMode('online'); setOnlineAction('create')
    setPlayer1(null); setSelectingFor(1); setScreen('character-select')
  }

  function handleGatewayJoin() {
    setGameMode('online'); setOnlineAction('join')
    setPlayer1(null); setSelectingFor(1); setScreen('character-select')
  }

  // ── Victory ───────────────────────────────────────────────────────
  const handleVictory = useCallback((
    winnerId: 1 | 2,
    time: number,
    coins: { p1: number; p2: number },
  ) => {
    setVictoryData({ winnerId, time, coins })

    if (gameMode === 'solo' && player1) {
      LocalProfiles.recordSoloRun(player1.id, time, coins.p1)
    } else if ((gameMode === '1v1' || gameMode === 'online') && player1 && player2) {
      LocalProfiles.recordMatch(player1.id, player2.id, winnerId, coins.p1, coins.p2)
    }

    DailyChallenges.onMatchComplete({
      mode:             gameMode === 'solo' ? 'solo' : '1v1',
      coinsCollected:   winnerId === 1 ? coins.p1 : coins.p2,
      powerupsUsed:     0,
      survivedTacoRain: false,
    })

    SeasonService.onMatchComplete({ won: winnerId === 1, coins: coins.p1 })

    setScreen(gameMode === 'solo' ? 'solo-victory' : 'victory')
  }, [gameMode, player1, player2])

  function startNewGame() {
    chaosRef.current = defaultChaosState()
    setMatchStart(Date.now())
    setScreen('game')
  }

  return (
    <div className="h-dvh bg-black overflow-hidden">

      {/* Global overlays — persist across screens */}
      <SettingsPanel      open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DailyChallengesPanel open={dailyOpen}  onClose={() => setDailyOpen(false)} />
      <CosmeticShop       open={shopOpen}     onClose={() => setShopOpen(false)} />
      <SeasonPanel        open={seasonOpen}   onClose={() => setSeasonOpen(false)} />

      <AnimatePresence mode="wait">

        {/* ── Main Menu ── */}
        {screen === 'main-menu' && (
          <motion.div key="main-menu" {...slide}>
            <MainMenu
              onPlay={() => setScreen('mode-select')}
              onLeaderboard={() => setScreen('leaderboard')}
              onDailyChallenges={() => setDailyOpen(true)}
              onSettings={() => setSettingsOpen(true)}
              onShop={() => setShopOpen(true)}
              onSeason={() => setSeasonOpen(true)}
            />
          </motion.div>
        )}

        {/* ── Mode Select ── */}
        {screen === 'mode-select' && (
          <motion.div key="mode-select" {...slide}>
            <ModeSelect
              onSelect={(mode) => {
                setGameMode(mode)
                setPlayer1(null); setPlayer2(null); setSelectingFor(1)
                if (mode === 'online') {
                  setScreen('online-gateway')
                } else {
                  setScreen('character-select')
                }
              }}
              onBack={() => setScreen('main-menu')}
            />
          </motion.div>
        )}

        {/* ── Character Select ── */}
        {screen === 'character-select' && (
          <motion.div key={`cs-p${selectingFor}-${gameMode}`} {...slide}>
            <CharacterSelect
              playerNumber={gameMode === 'online' ? 1 : selectingFor}
              onSelect={handleCharSelect}
              onBack={handleCharSelectBack}
            />
          </motion.div>
        )}

        {/* ── Online Gateway ── */}
        {screen === 'online-gateway' && (
          <motion.div key="online-gateway" {...slide}>
            <OnlineGateway
              onCreate={handleGatewayCreate}
              onJoin={handleGatewayJoin}
              onBack={() => setScreen('mode-select')}
            />
          </motion.div>
        )}

        {/* ── Online Create Room ── */}
        {screen === 'online-create' && player1 && (
          <motion.div key="online-create" {...slide}>
            <RoomCreator
              player={player1}
              playerName={playerName}
              onCreated={(code) => { setRoomCode(code); setScreen('online-lobby') }}
              onBack={() => setScreen('online-gateway')}
            />
          </motion.div>
        )}

        {/* ── Online Join Room ── */}
        {screen === 'online-join' && player1 && (
          <motion.div key="online-join" {...slide}>
            <RoomJoiner
              player={player1}
              playerName={playerName}
              onJoined={(code) => { setRoomCode(code); setScreen('online-lobby') }}
              onBack={() => setScreen('online-gateway')}
            />
          </motion.div>
        )}

        {/* ── Online Lobby ── */}
        {screen === 'online-lobby' && roomCode && player1 && (
          <motion.div key="online-lobby" {...slide}>
            <OnlineLobby
              roomCode={roomCode}
              localPlayerId={player1.id}
              onMatchStart={startNewGame}
              onLeave={() => { setRoomCode(null); setScreen('online-gateway') }}
            />
          </motion.div>
        )}

        {/* ── Local Lobby ── */}
        {screen === 'lobby' && player1 && (
          <motion.div key="lobby" {...slide}>
            <FamilyLobby
              player1={player1}
              player2={player2}
              mode={gameMode === 'solo' ? 'solo' : '1v1'}
              onStartMatch={startNewGame}
              onBack={() => {
                if (gameMode === '1v1') { setSelectingFor(2); setScreen('character-select') }
                else { setSelectingFor(1); setScreen('character-select') }
              }}
            />
          </motion.div>
        )}

        {/* ── Game ── */}
        {screen === 'game' && player1 && (
          <motion.div key="game" {...slide} className="relative h-dvh bg-[#060610] flex items-center justify-center overflow-hidden">
            <div
              className="relative w-full max-w-[960px] aspect-video"
              style={{ maxHeight: '100dvh' }}
            >
              <GameCanvas
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStart}
                mode={gameMode === 'solo' ? 'solo' : gameMode === 'online' ? 'online' : '1v1'}
                onVictory={handleVictory}
                chaosRef={chaosRef}
                remoteGhosts={gameMode === 'online' ? remoteGhosts : undefined}
                onTickSync={gameMode === 'online' ? publishState : undefined}
              />
              <GameHUD
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStart}
                chaosRef={chaosRef}
                mode={gameMode === 'solo' ? 'solo' : '1v1'}
              />
              {gameMode === '1v1' && (
                <TrapHUD player1={player1} player2={player2} chaosRef={chaosRef} />
              )}
            </div>
            {/* Controls anchored to bottom of full screen, not the canvas box */}
            <TouchControls mode={gameMode === '1v1' ? '1v1' : gameMode === 'online' ? 'online' : 'solo'} />
          </motion.div>
        )}

        {/* ── 1v1 / Online Victory ── */}
        {screen === 'victory' && victoryData && player1 && (
          <motion.div key="victory" {...slide}>
            <VictoryScreen
              winner={victoryData.winnerId === 1 ? player1 : player2}
              loser={victoryData.winnerId === 1 ? player2 : player1}
              time={victoryData.time}
              winnerCoins={victoryData.winnerId === 1 ? victoryData.coins.p1 : victoryData.coins.p2}
              loserCoins={victoryData.winnerId === 1 ? victoryData.coins.p2 : victoryData.coins.p1}
              onPlayAgain={() => { chaosRef.current = defaultChaosState(); setMatchStart(Date.now()); setScreen('game') }}
              onBackToLobby={() => setScreen(gameMode === 'online' ? 'online-lobby' : 'lobby')}
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
              onPlayAgain={() => { chaosRef.current = defaultChaosState(); setMatchStart(Date.now()); setScreen('game') }}
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

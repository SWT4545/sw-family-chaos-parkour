'use client'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { preloadGameAssets } from '@/lib/game/assets/preloadAssets'
import { MusicManager } from '@/lib/game/audio/MusicManager'
import { AudioEngine } from '@/lib/audio/AudioEngine'
import { MusicService } from '@/lib/audio/MusicService'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'
import { DailyChallenges } from '@/lib/profiles/DailyChallenges'
import { SeasonService } from '@/lib/season/SeasonService'
import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import { ProgressionService } from '@/lib/game/levels/ProgressionService'
import { DailyChallengeService } from '@/lib/game/liveops/DailyChallengeService'
import { WeeklyEventService } from '@/lib/game/liveops/WeeklyEventService'
import { syncProfileToLeaderboards } from '@/lib/game/leaderboard/LeaderboardService'
import { runMigrationIfNeeded } from '@/lib/game/migrations/migratePhase9'
import { ShopService } from '@/lib/game/shop/ShopService'
import { CHARACTERS } from '@/lib/game/characters/characters'
import { WORLD_REGISTRY, getAllLevels } from '@/lib/game/levels/WorldRegistry'
import { useGameSync } from '@/hooks/useGameSync'
import { useRaceSync } from '@/hooks/useRaceSync'
import { RaceCountdown } from '@/components/online/RaceCountdown'
import { RaceResults } from '@/components/online/RaceResults'
import { subscribeToRoom } from '@/lib/firebase/rooms'
import type { RaceResult } from '@/types/room'
import { MainMenu } from '@/components/MainMenu'
import { ModeSelect } from '@/components/screens/ModeSelect'
import { CharacterSelect } from '@/components/characters/CharacterSelect'
import { FamilyLobby } from '@/components/lobby/FamilyLobby'
import { GameCanvas } from '@/components/game/GameCanvas'
import { ThreeCharacterLayer } from '@/components/game/ThreeCharacterLayer'
import { GameHUD } from '@/components/hud/GameHUD'
import { TrapHUD } from '@/components/game/TrapHUD'
import { TouchControls } from '@/components/game/TouchControls'
import { getRenderMode, setRenderMode } from '@/lib/game/rendering/CharacterRenderMode'
import type { CharacterRenderMode } from '@/lib/game/rendering/CharacterRenderMode'
import { defaultGameRenderState } from '@/lib/game/rendering/GameRenderState'
import { VictoryScreen } from '@/components/screens/VictoryScreen'
import { SoloVictoryScreen } from '@/components/screens/SoloVictoryScreen'
import { GameOverScreen } from '@/components/screens/GameOverScreen'
import { Leaderboard } from '@/components/screens/Leaderboard'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { DailyChallengesPanel } from '@/components/screens/DailyChallenges'
import { CosmeticShop } from '@/components/cosmetics/CosmeticShop'
import { SeasonPanel } from '@/components/cosmetics/SeasonPanel'
import { OnlineGateway } from '@/components/online/OnlineGateway'
import { RoomCreator } from '@/components/online/RoomCreator'
import { RoomJoiner } from '@/components/online/RoomJoiner'
import { OnlineLobby } from '@/components/online/OnlineLobby'
import { LevelSelect } from '@/components/screens/LevelSelect'
import { WorldSelect } from '@/components/screens/WorldSelect'
import { CourseSelect } from '@/components/screens/CourseSelect'
import { CourseVictoryScreen } from '@/components/screens/CourseVictoryScreen'
import { ALL_LEVELS, getLevelById } from '@/lib/game/maps/levelRegistry'
import { getNextCourse } from '@/lib/game/maps/courses'
import { CourseProgressionService } from '@/lib/profiles/CourseProgression'
import { Character, GameScreen, GameMode } from '@/types/player'
import type { LevelDef, CourseDef, CourseDifficulty } from '@/types/game'
import { DIFFICULTY_CONFIGS as DIFF_CONFIGS } from '@/types/game'
import type { RoomPlayer } from '@/types/room'
import { ChaosState, defaultChaosState } from '@/types/chaos'
import type { CourseProgressionState } from '@/lib/profiles/CourseProgression'
import { submitLeaderboardScore } from '@/lib/firebase/leaderboards'
import { ScoreService } from '@/lib/game/scoring/ScoreService'
import type { ScoreBreakdown } from '@/lib/game/scoring/ScoreTypes'
import type { WorldDef, WorldLevelDef } from '@/lib/game/levels/LevelTypes'

const slide = {
  initial:    { opacity: 0, scale: 0.98 },
  animate:    { opacity: 1, scale: 1 },
  exit:       { opacity: 0, scale: 1.015 },
  transition: { duration: 0.22, ease: 'easeInOut' as const },
}

const LIVES_BY_DIFFICULTY: Record<string, number | undefined> = {
  starter: undefined,  // Training Grounds — unlimited
  normal:  4,
  hard:    3,
  expert:  2,
  chaos:   1,
}

interface VictoryData {
  winnerId: 1 | 2
  time:     number
  coins:    { p1: number; p2: number }
}

export default function Home() {
  const [screen,        setScreen]       = useState<GameScreen>('main-menu')
  const [gameMode,      setGameMode]     = useState<GameMode>('solo')
  const [selectingFor,  setSelectingFor] = useState<1 | 2>(1)
  const [player1,       setPlayer1]      = useState<Character | null>(null)
  const [player2,       setPlayer2]      = useState<Character | null>(null)
  const [matchStart,    setMatchStart]   = useState(0)
  const [victoryData,   setVictoryData]  = useState<VictoryData | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LevelDef>(ALL_LEVELS[0])
  const [selectedWorldLevel, setSelectedWorldLevel] = useState<WorldLevelDef | null>(null)
  const [selectedWorldDef,   setSelectedWorldDef]   = useState<WorldDef | null>(null)
  // Coin/XP earned in last session (for victory screen breakdown)
  const [lastSessionCoins, setLastSessionCoins] = useState(0)
  const [lastSessionXp,    setLastSessionXp]    = useState(0)

  // Solo campaign result (stars, next level, unlocks, score)
  const [soloResult, setSoloResult] = useState<{
    starsEarned:    0|1|2|3
    coinsEarned:    number
    xpEarned:       number
    isFirstClear:   boolean
    nextLevel?:     { id: string; title: string; subtitle: string }
    unlockedItems?: string[]
    deaths?:        number
    scoreBreakdown?: ScoreBreakdown
  } | null>(null)

  // Course mode state
  const [selectedCourse,     setSelectedCourse]     = useState<CourseDef | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<CourseDifficulty>('easy')
  const [courseProgression,  setCourseProgression]  = useState<CourseProgressionState | null>(null)
  const [courseVictoryData,  setCourseVictoryData]  = useState<{ newCourseUnlocked: boolean; newDifficultyUnlocked: boolean; badgeEarned?: string } | null>(null)

  // Overlays
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dailyOpen,    setDailyOpen]    = useState(false)
  const [shopOpen,     setShopOpen]     = useState(false)
  const [seasonOpen,   setSeasonOpen]   = useState(false)

  // Online state
  const [roomCode,        setRoomCode]        = useState<string | null>(null)
  const [localSessionId,  setLocalSessionId]  = useState<string | null>(null)
  const [onlinePlayers,   setOnlinePlayers]   = useState<RoomPlayer[]>([])
  const [playerName,      setPlayerName]      = useState('Player')
  const [onlineAction,    setOnlineAction]    = useState<'create' | 'join'>('create')

  // Race state
  const [raceCountdownStart,  setRaceCountdownStart]  = useState(0)
  const [raceResults,         setRaceResults]         = useState<RaceResult[]>([])
  const [onlineRaceFinished,  setOnlineRaceFinished]  = useState(false)

  // Room status watcher during race — handles results transition for all players
  useEffect(() => {
    if (!roomCode || gameMode !== 'online') return
    if (screen !== 'game' && screen !== 'race-countdown') return
    const unsub = subscribeToRoom(
      roomCode,
      (room) => {
        if (room?.status === 'results' && room.raceResults) {
          setRaceResults(room.raceResults)
          setScreen('race-results')
        }
      },
      () => {},
    )
    return () => unsub()
  }, [roomCode, gameMode, screen])

  const [returnScreenAfterChar, setReturnScreenAfterChar] = useState<'world-select' | 'lobby'>('world-select')
  const [campaignLevelName, setCampaignLevelName] = useState<string | undefined>(undefined)

  const chaosRef        = useRef<ChaosState>(defaultChaosState())
  const gameRenderRef   = useRef(defaultGameRenderState())
  const isCompletingRef = useRef(false)   // guard: prevents handleVictory firing twice
  const [renderMode, setRenderModeState] = useState<CharacterRenderMode>('png2d')
  const [gamePaused, setGamePaused]      = useState(false)

  useEffect(() => { setRenderModeState(getRenderMode()) }, [])

  // Escape key toggles pause during game
  useEffect(() => {
    if (screen !== 'game') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setGamePaused(p => !p) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen])

  // Reset pause when leaving game
  useEffect(() => { if (screen !== 'game') setGamePaused(false) }, [screen])

  function exitGame() {
    setGamePaused(false)
    if (gameMode === 'online') { setScreen('online-lobby') }
    else if (gameMode === '1v1') { setScreen('lobby') }
    else { setScreen('lobby') }
  }

  function toggleRenderMode() {
    const next: CharacterRenderMode = renderMode === 'png2d' ? 'threePrimitive' : 'png2d'
    setRenderMode(next)
    setRenderModeState(next)
  }

  // Build character map for online ghost lookup (uses proper Character type mapping)
  const characterMap = useMemo(() => {
    const m = new Map<string, Character>()
    CHARACTERS.forEach(c => m.set(c.id, c))
    return m
  }, [])

  // Non-online game sync (1v1 / solo — roomCode is null so it's a no-op)
  const remotePlayers = onlinePlayers.filter(p => p.id !== localSessionId)
  const { remoteGhosts: legacyGhosts, publishState: legacyPublishState, publishStateNow: legacyPublishStateNow } = useGameSync(
    gameMode !== 'online' ? null : null,
    localSessionId,
    remotePlayers,
    characterMap,
  )

  // Online race sync (active only during online game)
  const localIsHost = onlinePlayers.find(p => p.id === localSessionId)?.isHost ?? false
  const raceFinishX = selectedLevel.map.finishX ?? 4200
  const { remoteGhosts: raceGhosts, raceProgress, publishState: racePublishState, publishStateNow: racePublishStateNow } = useRaceSync({
    roomCode:         gameMode === 'online' && screen === 'game' ? roomCode : null,
    localPlayerId:    localSessionId,
    allPlayers:       onlinePlayers,
    characterMap,
    isHost:           localIsHost,
    finishX:          raceFinishX,
    countdownStartAt: raceCountdownStart,
  })

  // Unify sync refs for game use
  const remoteGhosts   = gameMode === 'online' ? raceGhosts       : legacyGhosts
  const publishState   = gameMode === 'online' ? racePublishState  : legacyPublishState
  const publishStateNow = gameMode === 'online' ? racePublishStateNow : legacyPublishStateNow

  // ── Phase 9 bootstrap ────────────────────────────────────────────
  useEffect(() => {
    preloadGameAssets()
    // Run data migration (idempotent — skips if already done)
    runMigrationIfNeeded()
    // Load Suno/remote music tracks into AudioEngine
    MusicService.loadRemoteTracks('swfcp')
    // Grant default shop items to ensure everyone starts with defaults
    const profile = PlayerProfileService.getCurrent()
    if (profile) ShopService.grantDefaults(profile.playerId)
  }, [])
  useEffect(() => {
    MusicManager.playScreen(screen)
    AudioEngine.playScreen(screen)
  }, [screen])

  // Set player name from profile on load
  useEffect(() => {
    const profiles = LocalProfiles.getAll()
    if (profiles.length > 0) setPlayerName(profiles[0].playerName)
  }, [])

  // Load campaign continue info on boot
  useEffect(() => {
    const profile = PlayerProfileService.getCurrent()
    if (profile?.currentCampaignLevelId) {
      const allLevels = getAllLevels()
      const level = allLevels.find(l => l.id === profile.currentCampaignLevelId)
      if (level) setCampaignLevelName(level.title)
    }
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
      if (gameMode === '1v1') { setSelectingFor(2) }
      else if (returnScreenAfterChar === 'lobby') {
        setReturnScreenAfterChar('world-select')
        setScreen('lobby')
      } else { setScreen('world-select') }
    } else {
      setPlayer2(char)
      setScreen('level-select')
    }
  }

  function handleCharSelectBack() {
    if (gameMode === 'online') { setScreen('online-gateway'); return }
    if (selectingFor === 1) { setScreen('mode-select') }
    else { setSelectingFor(1); setPlayer2(null) }
  }

  function handleContinueCampaign() {
    const profile = PlayerProfileService.getCurrent()
    if (!profile?.currentCampaignLevelId) return
    const allLevels = getAllLevels()
    const level = allLevels.find(l => l.id === profile.currentCampaignLevelId)
    if (!level) return
    const world = WORLD_REGISTRY.find(w => w.id === level.worldId)
    if (!world) return
    setGameMode('solo')
    setPlayer1(null)
    setSelectingFor(1)
    setSelectedWorldDef(world)
    setSelectedWorldLevel(level)
    setSelectedLevel({
      id: level.id, name: level.title, subtitle: level.subtitle,
      difficulty: level.difficulty as never, difficultyNum: level.levelNumber,
      description: level.description, unlockReward: '',
      map: level.map,
    })
    setReturnScreenAfterChar('lobby')
    setScreen('character-select')
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
    extra?: { soloDeaths?: number; p1TrapHits?: number; p1MoneyBags?: number },
  ) => {
    // Guard against double-fire (gameOver flag in GameCanvas is the primary guard, this is belt-and-suspenders)
    if (isCompletingRef.current) return
    isCompletingRef.current = true

    setVictoryData({ winnerId, time, coins })

    // Legacy level completion key (backward compat with LevelSelect)
    const completedKey = 'swfcp_completed_levels'
    try {
      const completed: string[] = JSON.parse(localStorage.getItem(completedKey) ?? '[]')
      if (!completed.includes(selectedLevel.id)) {
        completed.push(selectedLevel.id)
        localStorage.setItem(completedKey, JSON.stringify(completed))
      }
    } catch {}

    // ── Phase 9: profile-based recording ──
    const profile = PlayerProfileService.getCurrent()
    const weeklyMod = WeeklyEventService.getModifier()

    if (gameMode === 'solo' && player1 && profile) {
      const rawCoins = coins.p1
      const boostedCoins = weeklyMod?.coinMultiplier
        ? Math.round(rawCoins * weeklyMod.coinMultiplier) : rawCoins

      // World level completion (if coming from WorldSelect)
      if (selectedWorldLevel && selectedWorldDef) {
        const deathCount   = extra?.soloDeaths    ?? 0
        const trapHitCount = extra?.p1TrapHits    ?? 0

        // Compute isBestTime from local profile (synchronous — no Firebase needed)
        const prevBest   = profile.bestTimesByCourse[selectedWorldLevel.id]
        const isBestTime = !prevBest || time * 1000 < prevBest

        // Total pickups on this map
        const totalCoinsOnMap = (selectedWorldLevel.map.coinPositions?.length ?? 0) +
          (selectedWorldLevel.map.moneyBagPositions?.length ?? 0) * 10

        // Calculate score immediately — all data is local
        const bd = ScoreService.calculate({
          difficulty:     selectedWorldLevel.difficulty,
          finishTimeMs:   time * 1000,
          parTimeMs:      selectedWorldLevel.parTimeMs,
          coinsCollected: coins.p1,
          totalCoins:     totalCoinsOnMap,
          deaths:         deathCount,
          trapHits:       trapHitCount,
          isBestTime,
        })

        // Compute stars locally (mirrors ProgressionService logic — instant, no Firebase)
        const allCoins = totalCoinsOnMap > 0 && coins.p1 >= totalCoinsOnMap
        const noDeath  = deathCount === 0
        let localStars: 0|1|2|3 = 1
        if (time * 1000 <= selectedWorldLevel.threeStarMs || (allCoins && noDeath)) localStars = 3
        else if (time * 1000 <= selectedWorldLevel.parTimeMs) localStars = 2

        // ── STEP 1: Show victory screen IMMEDIATELY — never freeze ──
        console.log('[LEVEL_COMPLETE_START]', { level: selectedWorldLevel.id, time, score: bd.finalScore, stars: localStars })
        setSoloResult({
          starsEarned:    localStars,
          coinsEarned:    boostedCoins,
          xpEarned:       50,
          isFirstClear:   !profile.completedLevels.includes(selectedWorldLevel.id),
          deaths:         deathCount,
          scoreBreakdown: bd,
        })
        setScreen('solo-victory')
        console.log('[VICTORY_SCREEN_SET]')

        // ── STEP 2: Persist in background — hydrate victory screen with accurate data ──
        console.log('[PERSISTENCE_START]')
        const persistTimeout = setTimeout(() => {
          console.warn('[PERSISTENCE_FAILED] Firebase took >1500ms — victory already showing')
        }, 1500)

        ProgressionService.processLevelComplete(
          profile.playerId,
          selectedWorldDef.id,
          selectedWorldLevel.id,
          time * 1000,
          boostedCoins,
          selectedWorldLevel.difficulty,
          deathCount,
        ).then(result => {
          clearTimeout(persistTimeout)
          setLastSessionCoins(result.coinsEarned)
          setLastSessionXp(result.xpEarned)

          const nextWL = selectedWorldDef.levels.find(l => l.id === result.nextLevelId)
          const nextLevelDisplay = nextWL
            ? { id: nextWL.id, title: nextWL.title, subtitle: nextWL.subtitle }
            : undefined

          const unlockedItems: string[] = []
          if (result.newCharacterUnlocked) unlockedItems.push(result.newCharacterUnlocked)
          if (result.newWorldUnlocked) unlockedItems.push(`World ${result.newWorldUnlocked.slice(-1)}`)

          // Submit rich leaderboard in background (don't block UI)
          submitLeaderboardScore({
            playerId:            profile.playerId,
            playerName:          player1!.name,
            characterId:         player1!.id,
            score:               bd.finalScore,
            category:            'level-score',
            updatedAt:           Date.now(),
            levelId:             selectedWorldLevel.id,
            worldId:             selectedWorldDef.id,
            difficulty:          selectedWorldLevel.difficulty,
            finishTimeMs:        time * 1000,
            finalScore:          bd.finalScore,
            coinsCollected:      coins.p1,
            totalCoinsAvailable: totalCoinsOnMap,
            deaths:              deathCount,
            trapHits:            trapHitCount,
            starsEarned:         result.starsEarned,
          })

          // Hydrate victory screen with accurate server data (functional update to preserve existing)
          setSoloResult(prev => prev ? {
            ...prev,
            starsEarned:    result.starsEarned,
            coinsEarned:    result.coinsEarned,
            xpEarned:       result.xpEarned,
            isFirstClear:   result.isFirstClear,
            nextLevel:      nextLevelDisplay,
            unlockedItems:  unlockedItems.length > 0 ? unlockedItems : undefined,
          } : prev)

          console.log('[PERSISTENCE_DONE]', { stars: result.starsEarned, coins: result.coinsEarned })
          syncProfileToLeaderboards(profile.playerId)
        }).catch(err => {
          clearTimeout(persistTimeout)
          console.error('[PERSISTENCE_FAILED]', err)
          // Victory screen is already showing — silently fail the Firebase write
        })
      } else {
        // Legacy solo run recording
        PlayerProfileService.recordLevelComplete({
          playerId:       profile.playerId,
          levelId:        selectedLevel.id,
          difficulty:     selectedLevel.difficulty,
          timeMs:         time * 1000,
          coinsCollected: boostedCoins,
          perfect:        false,
          allCoins:       false,
          isFirstClear:   !profile.completedLevels.includes(selectedLevel.id),
          isBestTime:     !profile.bestTimesByCourse[selectedLevel.id] || time * 1000 < profile.bestTimesByCourse[selectedLevel.id],
        }).then(result => {
          setLastSessionCoins(result.coinsEarned)
          setLastSessionXp(result.xpEarned)
          syncProfileToLeaderboards(profile.playerId)
        })
      }

      // Daily challenge progress
      DailyChallengeService.updateProgress('solo_runs', 1)
      DailyChallengeService.updateProgress('coins', coins.p1)
    } else if ((gameMode === '1v1' || gameMode === 'online') && player1 && player2 && profile) {
      const won = winnerId === 1
      PlayerProfileService.recordMatch({
        playerId: profile.playerId,
        won,
        coins: won ? coins.p1 : coins.p2,
      }).then(() => syncProfileToLeaderboards(profile.playerId))

      DailyChallengeService.updateProgress('wins', won ? 1 : 0)
    }

    // ── Legacy profile recording (keeps old system running) ──
    if (gameMode === 'solo' && player1) {
      LocalProfiles.recordSoloRun(player1.id, time, coins.p1)
    } else if ((gameMode === '1v1' || gameMode === 'online') && player1 && player2) {
      LocalProfiles.recordMatch(player1.id, player2.id, winnerId, coins.p1, coins.p2)
    }

    // Legacy leaderboard sync
    const now = Date.now()
    const syncLegacy = (charId: string, name: string) => {
      const p = LocalProfiles.getByCharacter(charId as never)
      if (!p) return
      submitLeaderboardScore({ playerId: charId, playerName: name, characterId: charId, score: p.wins,       category: 'wins',      updatedAt: now })
      submitLeaderboardScore({ playerId: charId, playerName: name, characterId: charId, score: p.totalCoins, category: 'coins',     updatedAt: now })
      if (p.bestSoloTime !== null)
        submitLeaderboardScore({ playerId: charId, playerName: name, characterId: charId, score: p.bestSoloTime, category: 'solo-time', updatedAt: now })
    }
    if (player1) syncLegacy(player1.id, player1.name)
    if (player2) syncLegacy(player2.id, player2.name)

    DailyChallenges.onMatchComplete({
      mode:             gameMode === 'solo' ? 'solo' : '1v1',
      coinsCollected:   winnerId === 1 ? coins.p1 : coins.p2,
      powerupsUsed:     0,
      survivedTacoRain: false,
    })

    SeasonService.onMatchComplete({ won: winnerId === 1, coins: coins.p1 })

    // Course mode — record progression and show course victory
    if (gameMode === 'solo' && selectedCourse) {
      const currentProgression = courseProgression ?? CourseProgressionService.load('rooftop-run')
      const nextCourse = getNextCourse(selectedCourse.id)
      const multiplier = DIFF_CONFIGS[selectedDifficulty].coinMultiplier
      const result = CourseProgressionService.recordCompletion({
        state:        currentProgression,
        courseId:     selectedCourse.id,
        nextCourseId: nextCourse?.id ?? null,
        difficulty:   selectedDifficulty,
        time,
        coins:        Math.round(coins.p1 * multiplier),
      })
      setCourseProgression(result.state)
      setCourseVictoryData({
        newCourseUnlocked:    result.newCourseUnlocked,
        newDifficultyUnlocked: result.newDifficultyUnlocked,
        badgeEarned:          result.badgeEarned,
      })
      setScreen('course-victory')
      return
    }

    // Fallback soloResult for non-world legacy levels (sync path — screen set below)
    if (gameMode === 'solo' && !selectedWorldLevel) {
      setSoloResult({
        starsEarned: 1,
        coinsEarned: coins.p1,
        xpEarned: 50,
        isFirstClear: false,
      })
    }

    // WorldLevel path sets screen inside the async .then() — skip here to prevent blank render
    if (gameMode === 'solo' && selectedWorldLevel && selectedWorldDef) return
    if (gameMode === 'online') { setOnlineRaceFinished(true); return }
    setScreen(gameMode === 'solo' ? 'solo-victory' : 'victory')
  }, [gameMode, player1, player2, selectedLevel, selectedCourse, selectedDifficulty, courseProgression, selectedWorldLevel, selectedWorldDef])

  function startNewGame() {
    isCompletingRef.current = false
    chaosRef.current = defaultChaosState()
    setMatchStart(Date.now())
    setScreen('game')
  }

  function handleNextLevel() {
    if (!soloResult?.nextLevel || !selectedWorldDef) return
    isCompletingRef.current = false
    const nextWL = selectedWorldDef.levels.find(l => l.id === soloResult!.nextLevel!.id)
    if (!nextWL) return
    setSelectedWorldLevel(nextWL)
    setSelectedLevel({
      id:            nextWL.id,
      name:          nextWL.title,
      subtitle:      nextWL.subtitle,
      difficulty:    nextWL.difficulty as never,
      difficultyNum: nextWL.levelNumber,
      description:   nextWL.description,
      unlockReward:  nextWL.completionReward.unlocks?.join(', ') ?? '',
      map:           nextWL.map,
    })
    setSoloResult(null)
    chaosRef.current = defaultChaosState()
    setMatchStart(Date.now())
    setScreen('game')
  }

  return (
    <div style={{ height: '100dvh', background: '#080808', overflow: 'hidden', position: 'relative' }}>

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
              onContinueCampaign={campaignLevelName ? handleContinueCampaign : undefined}
              campaignLevelName={campaignLevelName}
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

        {/* ── World Select (Phase 9 — primary solo flow) ── */}
        {screen === 'world-select' && (
          <motion.div key="world-select" {...slide}>
            <WorldSelect
              onSelectLevel={(world, level) => {
                setSelectedWorldDef(world)
                setSelectedWorldLevel(level)
                // Map WorldLevelDef → LevelDef for GameCanvas compatibility
                setSelectedLevel({
                  id:           level.id,
                  name:         level.title,
                  subtitle:     level.subtitle,
                  difficulty:   level.difficulty as never,
                  difficultyNum: level.levelNumber,
                  description:  level.description,
                  unlockReward: level.completionReward.unlocks?.join(', ') ?? '',
                  map:          level.map,
                })
                AudioEngine.playWorld(world.id)
                setScreen('lobby')
              }}
              onBack={() => { setSelectingFor(1); setScreen('character-select') }}
            />
          </motion.div>
        )}

        {/* ── Level Select ── */}
        {screen === 'level-select' && (
          <motion.div key="level-select" {...slide}>
            <LevelSelect
              onSelect={(level) => { setSelectedLevel(level); setScreen('lobby') }}
              onBack={() => {
                if (gameMode === '1v1') { setPlayer2(null); setSelectingFor(2); setScreen('character-select') }
                else { setSelectingFor(1); setScreen('character-select') }
              }}
              playerNumber={selectingFor}
            />
          </motion.div>
        )}

        {/* ── Course Select ── */}
        {screen === 'course-select' && (
          <motion.div key="course-select" {...slide}>
            <CourseSelect
              onSelect={(course, difficulty) => {
                setSelectedCourse(course)
                setSelectedDifficulty(difficulty)
                setSelectedLevel({
                  id:           course.id,
                  name:         course.name,
                  subtitle:     course.subtitle,
                  difficulty:   'easy',
                  difficultyNum: course.courseNumber,
                  description:  course.description,
                  unlockReward: '',
                  map:          course.map,
                })
                setScreen('lobby')
              }}
              onBack={() => { setSelectingFor(1); setScreen('character-select') }}
              playerNumber={selectingFor}
            />
          </motion.div>
        )}

        {/* ── Course Victory ── */}
        {screen === 'course-victory' && victoryData && player1 && selectedCourse && courseVictoryData && (
          <motion.div key="course-victory" {...slide}>
            <CourseVictoryScreen
              player={player1}
              course={selectedCourse}
              difficulty={selectedDifficulty}
              time={victoryData.time}
              coins={victoryData.coins.p1}
              newCourseUnlocked={courseVictoryData.newCourseUnlocked}
              nextCourse={getNextCourse(selectedCourse.id)}
              newDifficultyUnlocked={courseVictoryData.newDifficultyUnlocked}
              badgeEarned={courseVictoryData.badgeEarned}
              onNextCourse={() => {
                const next = getNextCourse(selectedCourse.id)
                if (next) {
                  setSelectedCourse(next)
                  setSelectedDifficulty('easy')
                  setSelectedLevel({
                    id:           next.id,
                    name:         next.name,
                    subtitle:     next.subtitle,
                    difficulty:   'easy',
                    difficultyNum: next.courseNumber,
                    description:  next.description,
                    unlockReward: '',
                    map:          next.map,
                  })
                  chaosRef.current = defaultChaosState()
                  setMatchStart(Date.now())
                  setScreen('game')
                }
              }}
              onReplayCourse={() => {
                chaosRef.current = defaultChaosState()
                setMatchStart(Date.now())
                setScreen('game')
              }}
              onBackToHub={() => setScreen('main-menu')}
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
              onCreated={(code, sessionId) => { setRoomCode(code); setLocalSessionId(sessionId); setScreen('online-lobby') }}
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
              onJoined={(code, sessionId) => { setRoomCode(code); setLocalSessionId(sessionId); setScreen('online-lobby') }}
              onBack={() => setScreen('online-gateway')}
            />
          </motion.div>
        )}

        {/* ── Online Lobby ── */}
        {screen === 'online-lobby' && roomCode && localSessionId && player1 && (
          <motion.div key="online-lobby" {...slide}>
            <OnlineLobby
              roomCode={roomCode}
              localPlayerId={localSessionId}
              onCountdownStarted={(startAt, levelId, worldId) => {
                const world = WORLD_REGISTRY.find(w => w.id === worldId)
                const lvl   = world?.levels.find(l => l.id === levelId)
                if (world && lvl) {
                  setSelectedWorldDef(world)
                  setSelectedWorldLevel(lvl)
                  setSelectedLevel({
                    id:           lvl.id,
                    name:         lvl.title,
                    subtitle:     lvl.subtitle,
                    difficulty:   lvl.difficulty as never,
                    difficultyNum: lvl.levelNumber,
                    description:  lvl.description,
                    unlockReward: '',
                    map:          lvl.map,
                  })
                }
                setRaceCountdownStart(startAt)
                setOnlineRaceFinished(false)
                setScreen('race-countdown')
              }}
              onLeave={() => { setRoomCode(null); setLocalSessionId(null); setOnlinePlayers([]); setScreen('online-gateway') }}
              onPlayersChange={setOnlinePlayers}
            />
          </motion.div>
        )}

        {/* ── Race Countdown ── */}
        {screen === 'race-countdown' && (
          <motion.div key="race-countdown" {...slide}>
            <RaceCountdown
              countdownStartAt={raceCountdownStart}
              levelName={selectedWorldLevel?.title ?? selectedLevel.name}
              playerCount={onlinePlayers.length}
              onGo={() => {
                chaosRef.current = defaultChaosState()
                setMatchStart(Date.now())
                setScreen('game')
              }}
            />
          </motion.div>
        )}

        {/* ── Race Results ── */}
        {screen === 'race-results' && (
          <motion.div key="race-results" {...slide}>
            <RaceResults
              results={raceResults}
              localPlayerId={localSessionId ?? ''}
              isHost={onlinePlayers.find(p => p.id === localSessionId)?.isHost ?? false}
              onRaceAgain={() => {
                setRaceResults([])
                setOnlineRaceFinished(false)
                setScreen('online-lobby')
              }}
              onBackToMenu={() => {
                setRoomCode(null)
                setLocalSessionId(null)
                setOnlinePlayers([])
                setRaceResults([])
                setOnlineRaceFinished(false)
                setScreen('main-menu')
              }}
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
              levelName={selectedLevel.name}
              onStartMatch={startNewGame}
              onBack={() => setScreen(gameMode === 'solo' ? 'world-select' : 'level-select')}
            />
          </motion.div>
        )}

        {/* ── Game ── */}
        {screen === 'game' && player1 && (
          <motion.div
            key="game"
            {...slide}
            style={{
              position: 'relative',
              height: '100dvh',
              background: '#060610',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* HUD — sits above gameplay in normal document flow */}
            <div style={{ flexShrink: 0, zIndex: 30 }}>
              <GameHUD
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStart}
                chaosRef={chaosRef}
                mode={gameMode === 'solo' ? 'solo' : gameMode === 'online' ? 'online' : '1v1'}
                levelName={selectedWorldLevel?.title ?? selectedLevel.name}
                soloLives={gameMode === 'solo' && selectedWorldLevel
                  ? LIVES_BY_DIFFICULTY[selectedWorldLevel.difficulty]
                  : undefined}
                isWorldLevel={gameMode === 'solo' && selectedWorldLevel !== null}
                raceProgress={gameMode === 'online' ? raceProgress : undefined}
              />
            </div>

            {/* Canvas area — fills remaining height after HUD */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Canvas box — aspect-ratio preserved within available space */}
            <div
              style={{
                position: 'relative',
                width:  'min(100vw, calc((100dvh - 60px) * 16 / 9))',
                height: 'min(calc(100dvh - 60px), calc(100vw * 9 / 16))',
                maxWidth: '960px',
                maxHeight: '540px',
              }}
            >
              <GameCanvas
                player1={player1}
                player2={gameMode === 'solo' ? null : player2}
                matchStartTime={matchStart}
                mode={gameMode === 'solo' ? 'solo' : gameMode === 'online' ? 'online' : '1v1'}
                onVictory={handleVictory}
                chaosRef={chaosRef}
                map={selectedLevel.map}
                remoteGhosts={gameMode === 'online' ? remoteGhosts : undefined}
                onTickSync={gameMode === 'online' ? publishState : undefined}
                onFinishSync={gameMode === 'online' ? publishStateNow : undefined}
                gameRenderRef={renderMode === 'threePrimitive' ? gameRenderRef : undefined}
                soloLives={gameMode === 'solo' && selectedWorldLevel
                  ? LIVES_BY_DIFFICULTY[selectedWorldLevel.difficulty]
                  : undefined}
                onGameOver={() => setScreen('game-over')}
              />
              {renderMode === 'threePrimitive' && (
                <ThreeCharacterLayer gameRenderRef={gameRenderRef} />
              )}
              {gameMode === '1v1' && (
                <TrapHUD player1={player1} player2={player2} chaosRef={chaosRef} />
              )}

              {/* ── Waiting for others overlay (online race: local player finished) ── */}
              {gameMode === 'online' && onlineRaceFinished && (
                <div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                >
                  <div className="text-center">
                    <p className="text-white font-black text-2xl uppercase tracking-widest mb-1">You Finished!</p>
                    <p className="text-gray-400 text-sm animate-pulse">Waiting for others...</p>
                  </div>
                </div>
              )}

              {/* ── Pause overlay ──────────────────────────────────── */}
              {gamePaused && (
                <div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto"
                  style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
                >
                  <p className="text-white font-black text-2xl uppercase tracking-widest mb-1">Paused</p>
                  <p className="text-gray-500 text-xs mb-8">Esc to resume</p>
                  <div className="flex flex-col gap-3 w-48">
                    <button
                      onClick={() => setGamePaused(false)}
                      className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest text-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={exitGame}
                      className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors"
                    >
                      Exit to Lobby
                    </button>
                  </div>
                </div>
              )}

              {/* ── Pause button (top-right of canvas, always visible) ── */}
              <button
                onClick={() => setGamePaused(p => !p)}
                className="absolute top-0 right-0 z-40 pointer-events-auto flex items-center justify-center"
                style={{
                  width: 36, height: 36,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.35)',
                  paddingTop: 'env(safe-area-inset-top)',
                }}
                aria-label="Pause"
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>⏸</span>
              </button>

              {/* Render mode toggle — bottom-right corner */}
              <button
                onClick={toggleRenderMode}
                className="absolute bottom-1 right-1 z-50 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded pointer-events-auto select-none"
                style={{
                  background: renderMode === 'threePrimitive' ? 'rgba(139,92,246,0.75)' : 'rgba(0,0,0,0.45)',
                  color: renderMode === 'threePrimitive' ? '#fff' : '#555',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {renderMode === 'threePrimitive' ? '3D' : '2D'}
              </button>
            </div>
            </div>{/* end canvas area */}

            {/* TouchControls — absolute inset-x-0 bottom-0, anchors to outer div */}
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
        {screen === 'solo-victory' && victoryData && player1 && soloResult && (
          <motion.div key="solo-victory" {...slide}>
            <SoloVictoryScreen
              player={player1}
              time={victoryData.time}
              coins={victoryData.coins.p1}
              starsEarned={soloResult.starsEarned}
              coinsEarned={soloResult.coinsEarned}
              xpEarned={soloResult.xpEarned}
              isFirstClear={soloResult.isFirstClear}
              nextLevel={soloResult.nextLevel}
              unlockedItems={soloResult.unlockedItems}
              scoreBreakdown={soloResult.scoreBreakdown}
              deaths={soloResult.deaths}
              onPlayAgain={() => { chaosRef.current = defaultChaosState(); setMatchStart(Date.now()); setScreen('game') }}
              onNextLevel={soloResult.nextLevel ? handleNextLevel : undefined}
              onWorldMap={() => setScreen('world-select')}
            />
          </motion.div>
        )}

        {/* ── Game Over ── */}
        {screen === 'game-over' && player1 && (
          <motion.div key="game-over" {...slide}>
            <GameOverScreen
              player={player1}
              levelTitle={selectedWorldLevel?.title ?? selectedLevel.name}
              livesUsed={selectedWorldLevel ? (LIVES_BY_DIFFICULTY[selectedWorldLevel.difficulty] ?? 0) : 0}
              onRetry={() => { setSoloResult(null); chaosRef.current = defaultChaosState(); setMatchStart(Date.now()); setScreen('game') }}
              onWorldMap={() => setScreen('world-select')}
              onMainMenu={() => setScreen('main-menu')}
              onChangeCharacter={() => {
                setReturnScreenAfterChar('lobby')
                setSelectingFor(1)
                setPlayer1(null)
                setScreen('character-select')
              }}
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

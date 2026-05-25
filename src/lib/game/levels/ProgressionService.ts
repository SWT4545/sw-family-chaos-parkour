import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import { WORLD_REGISTRY, getLevel } from './WorldRegistry'

// ── Character unlock conditions ───────────────────────────────────────────────
const CHARACTER_UNLOCK_LEVEL: Record<string, string> = {
  bj:       'family-city-training-grounds',
  brae:     'family-city-rooftop-run',
  xanny:    'family-city-school-dash',
  zaya:     'family-city-boss-chaos-drone',
  governor: 'w2_boss',
}

// ── World unlock conditions ───────────────────────────────────────────────────
const WORLD_UNLOCK_BOSS: Record<string, string> = {
  world2: 'family-city-boss-chaos-drone',
  world3: 'w2_boss',
  world4: 'w3_boss',
  world5: 'w4_boss',
  world6: 'w5_boss',
}

export interface CompletionResult {
  newCharacterUnlocked: string | null
  newWorldUnlocked:     string | null
  newCourseUnlocked:    string | null
  worldComplete:        boolean
  coinsEarned:          number
  xpEarned:             number
  starsEarned:          0|1|2|3
  isFirstClear:         boolean
  nextLevelId?:         string
}

export const ProgressionService = {
  // ── Check what's unlocked after a level completion ──
  async processLevelComplete(
    playerId: string,
    worldId: string,
    levelId: string,
    timeMs: number,
    coinsCollected: number,
    difficulty: string,
    deathCount = 0,
  ): Promise<CompletionResult> {
    const profile = PlayerProfileService.getCurrent()
    const empty: CompletionResult = {
      newCharacterUnlocked: null, newWorldUnlocked: null, newCourseUnlocked: null,
      worldComplete: false, coinsEarned: 0, xpEarned: 0, starsEarned: 1, isFirstClear: false,
    }
    if (!profile || profile.playerId !== playerId) return empty

    const level = getLevel(worldId, levelId)
    if (!level) return empty

    const alreadyCompleted = profile.completedLevels.includes(levelId)
    const firstCompKey     = `${levelId}_${difficulty}`
    const isFirstClear     = !profile.firstCompletions.includes(firstCompKey)

    const prevBest   = profile.bestTimesByCourse[levelId]
    const isBestTime = !prevBest || timeMs < prevBest

    // ── Star calculation ──
    const totalCoinsOnMap = level.map.coinPositions?.length ?? 0
    const allCoins = totalCoinsOnMap > 0 && coinsCollected >= totalCoinsOnMap
    const noDeath  = deathCount === 0
    let starsEarned: 0|1|2|3 = 1
    if (timeMs <= level.threeStarMs || (allCoins && noDeath)) starsEarned = 3
    else if (timeMs <= level.parTimeMs) starsEarned = 2

    // Record in profile
    const { coinsEarned, xpEarned } = await PlayerProfileService.recordLevelComplete({
      playerId,
      levelId,
      difficulty,
      timeMs,
      coinsCollected,
      perfect:      false,
      allCoins,
      isFirstClear,
      isBestTime,
      starsEarned,
      nextLevelId:  level.nextLevelId,
    })

    // Add level completion reward coins/xp
    if (!alreadyCompleted && level.completionReward) {
      const extra = level.completionReward.coins ?? 0
      if (extra > 0) {
        const p = PlayerProfileService.getCurrent()!
        p.coins            += extra
        p.totalCoinsEarned += extra
        p.xp               += level.completionReward.xp ?? 0
        await PlayerProfileService.save(p)
      }
    }

    // ── Check character unlocks ──
    let newCharacterUnlocked: string | null = null
    for (const [charId, unlockLevel] of Object.entries(CHARACTER_UNLOCK_LEVEL)) {
      if (unlockLevel === levelId && !profile.unlockedCharacters.includes(charId)) {
        await PlayerProfileService.unlockCharacter(playerId, charId)
        newCharacterUnlocked = charId
      }
    }

    // ── Check world unlocks ──
    let newWorldUnlocked: string | null = null
    for (const [worldToUnlock, bossLevel] of Object.entries(WORLD_UNLOCK_BOSS)) {
      if (bossLevel === levelId && !profile.unlockedWorlds.includes(worldToUnlock)) {
        await PlayerProfileService.unlockWorld(playerId, worldToUnlock)
        newWorldUnlocked = worldToUnlock
      }
    }

    // ── Check if world complete ──
    let worldComplete = false
    const world = WORLD_REGISTRY.find(w => w.id === worldId)
    if (world) {
      const p = PlayerProfileService.getCurrent()!
      const allWorldLevels = world.levels.map(l => l.id)
      const allDone = allWorldLevels.every(lid => p.completedLevels.includes(lid))
      if (allDone && !p.completedWorlds.includes(worldId)) {
        await PlayerProfileService.completeWorld(playerId, worldId)
        worldComplete = true
      }
    }

    return {
      newCharacterUnlocked,
      newWorldUnlocked,
      newCourseUnlocked: null,
      worldComplete,
      coinsEarned,
      xpEarned,
      starsEarned,
      isFirstClear,
      nextLevelId: level.nextLevelId,
    }
  },

  // ── Check if a level is unlocked for a player ──
  isLevelUnlocked(playerId: string, worldId: string, levelId: string): boolean {
    const profile = PlayerProfileService.getCurrent()
    if (!profile) return false
    if (!profile.unlockedWorlds.includes(worldId)) return false

    const world = WORLD_REGISTRY.find(w => w.id === worldId)
    if (!world) return false

    const level = world.levels.find(l => l.id === levelId)
    if (!level) return false

    // Level 1 of each world is always unlocked if the world is unlocked
    if (level.levelNumber === 1) return true

    // Otherwise need to have completed the previous level
    const prevLevel = world.levels.find(l => l.levelNumber === level.levelNumber - 1)
    if (!prevLevel) return true
    return profile.completedLevels.includes(prevLevel.id)
  },

  // ── Check if a world is unlocked ──
  isWorldUnlocked(playerId: string, worldId: string): boolean {
    const profile = PlayerProfileService.getCurrent()
    if (!profile) return false
    return profile.unlockedWorlds.includes(worldId)
  },

  // ── Get progress summary for a world ──
  getWorldProgress(playerId: string, worldId: string) {
    const profile = PlayerProfileService.getCurrent()
    if (!profile) return null
    const world = WORLD_REGISTRY.find(w => w.id === worldId)
    if (!world) return null
    const total     = world.levels.length
    const completed = world.levels.filter(l => profile.completedLevels.includes(l.id)).length
    return { total, completed, pct: Math.round((completed / total) * 100) }
  },
}

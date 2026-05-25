'use client'
import {
  doc, setDoc, getDoc, updateDoc,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firebaseConfig'
import {
  PlayerProfile, defaultProfile, xpToLevel,
  COIN_REWARDS, XP_REWARDS, EquippedCosmetics,
} from './ProfileTypes'

const LS_KEY    = 'sw-player-profile-v1'
const COLL      = 'swfcp_players_v2'

// ── Persistence ──────────────────────────────────────────────────────────────

function loadLocal(): PlayerProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as PlayerProfile) : null
  } catch { return null }
}

function saveLocal(p: PlayerProfile): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch {}
}

async function loadFirestore(playerId: string): Promise<PlayerProfile | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLL, playerId))
    return snap.exists() ? (snap.data() as PlayerProfile) : null
  } catch { return null }
}

async function saveFirestore(p: PlayerProfile): Promise<void> {
  const db = getDb()
  if (!db) return
  try { await setDoc(doc(db, COLL, p.playerId), p) } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

export const PlayerProfileService = {
  // ── Load (local first, then Firebase merge) ──
  async load(playerId: string, displayName?: string, characterId?: string): Promise<PlayerProfile> {
    const local = loadLocal()

    if (local && local.playerId === playerId) {
      // Try merging from Firestore (remote may have newer data)
      const remote = await loadFirestore(playerId)
      if (remote && remote.updatedAt > local.updatedAt) {
        saveLocal(remote)
        return remote
      }
      return local
    }

    // No matching local — check Firestore
    const remote = await loadFirestore(playerId)
    if (remote) {
      saveLocal(remote)
      return remote
    }

    // Brand new player
    const fresh = defaultProfile(
      playerId,
      displayName ?? 'Player',
      characterId ?? 'commander',
    )
    saveLocal(fresh)
    saveFirestore(fresh)
    return fresh
  },

  // ── Get current (sync, local only) ──
  getCurrent(): PlayerProfile | null {
    return loadLocal()
  },

  // ── Save ──
  async save(p: PlayerProfile): Promise<void> {
    p.updatedAt = Date.now()
    p.level = xpToLevel(p.xp)
    saveLocal(p)
    await saveFirestore(p)
  },

  // ── Add coins + XP from level completion ──
  async recordLevelComplete(opts: {
    playerId:        string
    levelId:         string
    difficulty:      string
    timeMs:          number
    coinsCollected:  number
    perfect:         boolean
    allCoins:        boolean
    isFirstClear:    boolean
    isBestTime:      boolean
  }): Promise<{ coinsEarned: number; xpEarned: number; profile: PlayerProfile }> {
    const p = loadLocal()
    if (!p || p.playerId !== opts.playerId) throw new Error('Profile not loaded')

    let coins = 0
    let xp    = XP_REWARDS.soloComplete

    // Base completion reward
    const base = COIN_REWARDS.completion[opts.difficulty] ?? 25
    coins += base
    coins += opts.coinsCollected * COIN_REWARDS.coinPickupValue

    // Bonuses
    if (opts.perfect)        { coins += COIN_REWARDS.bonuses.perfectRun;        }
    if (opts.allCoins)       { coins += COIN_REWARDS.bonuses.allCoinsCollected;  }
    if (opts.isBestTime)     { coins += COIN_REWARDS.bonuses.newBestTime;  xp += XP_REWARDS.newBestTime }
    if (opts.isFirstClear)   { coins += COIN_REWARDS.bonuses.firstCompletion; xp += XP_REWARDS.firstClear }

    // Apply to profile
    p.coins            += coins
    p.totalCoinsEarned += coins
    p.xp               += xp
    p.soloRunsCompleted++

    if (!p.completedLevels.includes(opts.levelId)) {
      p.completedLevels.push(opts.levelId)
    }
    if (opts.isFirstClear && !p.firstCompletions.includes(`${opts.levelId}_${opts.difficulty}`)) {
      p.firstCompletions.push(`${opts.levelId}_${opts.difficulty}`)
    }

    // Best time per course
    const prev = p.bestTimesByCourse[opts.levelId]
    if (!prev || opts.timeMs < prev) {
      p.bestTimesByCourse[opts.levelId] = opts.timeMs
    }

    await PlayerProfileService.save(p)
    return { coinsEarned: coins, xpEarned: xp, profile: p }
  },

  // ── Record match ──
  async recordMatch(opts: {
    playerId: string
    won:      boolean
    coins:    number
  }): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== opts.playerId) return
    if (opts.won) { p.wins++; p.multiplayerWins++ } else { p.losses++ }
    p.coins            += opts.coins
    p.totalCoinsEarned += opts.coins
    p.xp               += opts.won ? XP_REWARDS.matchWin : XP_REWARDS.matchLoss
    await PlayerProfileService.save(p)
  },

  // ── Spend coins (returns false if insufficient) ──
  async spendCoins(playerId: string, amount: number): Promise<boolean> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return false
    if (p.coins < amount) return false
    p.coins -= amount
    await PlayerProfileService.save(p)
    return true
  },

  // ── Unlock character ──
  async unlockCharacter(playerId: string, characterId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.unlockedCharacters.includes(characterId)) {
      p.unlockedCharacters.push(characterId)
      await PlayerProfileService.save(p)
    }
  },

  // ── Unlock world ──
  async unlockWorld(playerId: string, worldId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.unlockedWorlds.includes(worldId)) {
      p.unlockedWorlds.push(worldId)
      await PlayerProfileService.save(p)
    }
  },

  // ── Complete world ──
  async completeWorld(playerId: string, worldId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.completedWorlds.includes(worldId)) {
      p.completedWorlds.push(worldId)
      await PlayerProfileService.save(p)
    }
  },

  // ── Own cosmetic ──
  async addCosmetic(playerId: string, cosmeticId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.ownedCosmetics.includes(cosmeticId)) {
      p.ownedCosmetics.push(cosmeticId)
      await PlayerProfileService.save(p)
    }
  },

  // ── Equip cosmetic slot ──
  async equipCosmetic(playerId: string, slot: keyof EquippedCosmetics, id: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.ownedCosmetics.includes(id) && id !== null) return
    ;(p.equippedCosmetics as unknown as Record<string, string | null>)[slot] = id
    await PlayerProfileService.save(p)
  },

  // ── Own music track ──
  async addMusicTrack(playerId: string, trackId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    if (!p.ownedMusicTracks.includes(trackId)) {
      p.ownedMusicTracks.push(trackId)
      await PlayerProfileService.save(p)
    }
  },

  // ── Grant achievement ──
  async grantAchievement(playerId: string, achievementId: string): Promise<boolean> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return false
    if (p.achievements.includes(achievementId)) return false
    p.achievements.push(achievementId)
    await PlayerProfileService.save(p)
    return true
  },

  // ── Daily challenge reward ──
  async rewardDailyChallenge(playerId: string, coins: number, xp: number): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    p.coins            += coins
    p.totalCoinsEarned += coins
    p.xp               += xp
    await PlayerProfileService.save(p)
  },

  // ── Update display name ──
  async setDisplayName(playerId: string, name: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    p.displayName = name
    await PlayerProfileService.save(p)
  },

  // ── Update selected character ──
  async setSelectedCharacter(playerId: string, characterId: string): Promise<void> {
    const p = loadLocal()
    if (!p || p.playerId !== playerId) return
    p.selectedCharacterId = characterId
    await PlayerProfileService.save(p)
  },
}

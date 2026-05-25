'use client'
import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import { defaultProfile, DEFAULT_EQUIPPED } from '@/lib/game/profile/ProfileTypes'

const MIGRATION_FLAG = 'sw-phase9-migration-complete'
const OLD_PROFILES_KEY = 'swc-local-profiles'
const OLD_COSMETICS_KEY = 'swfcp-cosmetics'

interface OldProfile {
  id:                  string
  playerName:          string
  selectedCharacterId: string
  totalCoins:          number
  wins:                number
  losses:              number
  soloRuns:            number
  bestSoloTime:        number | null
  favoriteCharacter:   string | null
  unlockedTrails:      string[]
  unlockedEmotes:      string[]
  unlockedOutfits:     string[]
  createdAt:           number
  lastUpdated:         number
}

interface OldInventory {
  ownedIds:            string[]
  equippedTrail?:      string
  equippedVictoryPose?: string
  equippedBorder?:     string
  equippedEmote?:      string
}

export async function runMigrationIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return

  try {
    // Read old data
    const rawProfiles  = localStorage.getItem(OLD_PROFILES_KEY)
    const rawInventory = localStorage.getItem(OLD_COSMETICS_KEY)

    const oldProfiles: OldProfile[]  = rawProfiles  ? JSON.parse(rawProfiles)  : []
    const oldInventory: OldInventory = rawInventory ? JSON.parse(rawInventory) : { ownedIds: [] }

    // Use first profile as primary (Dad/Commander)
    const primary = oldProfiles.find(p => p.id === 'dad') ?? oldProfiles[0]

    if (!primary) {
      localStorage.setItem(MIGRATION_FLAG, 'true')
      return
    }

    // Aggregate coins and wins across all old profiles
    const totalCoins = oldProfiles.reduce((s, p) => s + (p.totalCoins ?? 0), 0)
    const totalWins  = oldProfiles.reduce((s, p) => s + (p.wins ?? 0), 0)
    const totalLoss  = oldProfiles.reduce((s, p) => s + (p.losses ?? 0), 0)
    const totalSolo  = oldProfiles.reduce((s, p) => s + (p.soloRuns ?? 0), 0)

    // Best solo time across all profiles
    const bestTime = oldProfiles.reduce<number | null>((best, p) => {
      if (p.bestSoloTime === null) return best
      if (best === null) return p.bestSoloTime
      return p.bestSoloTime < best ? p.bestSoloTime : best
    }, null)

    // Merge owned cosmetics
    const ownedCosmetics = [
      'trail_default', 'border_default', 'pose_default', 'emote_gg',
      ...(oldInventory.ownedIds ?? []),
    ]
    const uniqueCosmetics = [...new Set(ownedCosmetics)]

    // Build new profile
    const newProfile = defaultProfile(
      primary.selectedCharacterId || 'commander',
      primary.playerName || 'Player',
      primary.selectedCharacterId || 'commander',
    )

    // Migrate data
    newProfile.coins             = totalCoins
    newProfile.totalCoinsEarned  = totalCoins
    newProfile.wins              = totalWins
    newProfile.losses            = totalLoss
    newProfile.soloRunsCompleted = totalSolo
    newProfile.ownedCosmetics    = uniqueCosmetics
    newProfile.equippedCosmetics = {
      trail:       oldInventory.equippedTrail      ?? DEFAULT_EQUIPPED.trail,
      border:      oldInventory.equippedBorder     ?? DEFAULT_EQUIPPED.border,
      emote:       oldInventory.equippedEmote      ?? DEFAULT_EQUIPPED.emote,
      victoryPose: oldInventory.equippedVictoryPose ?? DEFAULT_EQUIPPED.victoryPose,
      badge:       null,
      musicTrack:  null,
      nameplate:   null,
    }

    if (bestTime !== null) {
      newProfile.bestTimesByCourse['rooftop-run'] = bestTime * 1000
    }

    // Characters unlocked by old profile completion
    newProfile.unlockedCharacters = ['commander']
    for (const p of oldProfiles) {
      if (p.selectedCharacterId && !newProfile.unlockedCharacters.includes(p.selectedCharacterId)) {
        newProfile.unlockedCharacters.push(p.selectedCharacterId)
      }
    }

    // Save migrated profile
    await PlayerProfileService.save(newProfile)
    localStorage.setItem(MIGRATION_FLAG, 'true')

    console.info('[Phase 9 Migration] Complete. Migrated', oldProfiles.length, 'old profiles.')
  } catch (err) {
    console.warn('[Phase 9 Migration] Failed:', err)
    // Mark done anyway to prevent boot loops
    localStorage.setItem(MIGRATION_FLAG, 'true')
  }
}

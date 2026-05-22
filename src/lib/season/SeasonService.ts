import type { SeasonConfig, SeasonProfile, SeasonReward } from '@/types/season'
import { saveSeasonProfile, fetchSeasonProfile } from '@/lib/firebase/seasonDb'
import { CosmeticInventoryManager } from '@/lib/cosmetics/CosmeticInventory'

const STORAGE_KEY = 'swfcp-season'

export const CURRENT_SEASON: SeasonConfig = {
  id:         'season-1',
  name:       'Season 1: Family Chaos Launch',
  startDate:  new Date('2025-01-01').getTime(),
  endDate:    new Date('2025-06-30').getTime(),
  levels:     30,
  xpPerLevel: 100,
}

export const SEASON_REWARDS: SeasonReward[] = [
  { level: 1,  cosmeticId: 'badge_founder',  label: 'Season 1 Founder Badge' },
  { level: 5,  cosmeticId: 'trail_slime',    label: 'Slime Trail' },
  { level: 10, cosmeticId: 'border_chaos',   label: 'Chaos Border' },
  { level: 20, cosmeticId: 'trail_taco',     label: 'Taco Trail' },
  { level: 30, cosmeticId: 'badge_s1champ',  label: 'Season 1 Champion Badge' },
]

function defaultProfile(): SeasonProfile {
  return {
    seasonId:            CURRENT_SEASON.id,
    seasonXP:            0,
    seasonLevel:         1,
    matchesPlayed:       0,
    wins:                0,
    coinsEarned:         0,
    claimedLevelRewards: [],
  }
}

function load(): SeasonProfile {
  if (typeof window === 'undefined') return defaultProfile()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultProfile()
  } catch { return defaultProfile() }
}

function persist(profile: SeasonProfile): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
}

export const SeasonService = {
  get(): SeasonProfile { return load() },

  addXP(xp: number): { profile: SeasonProfile; newRewards: SeasonReward[] } {
    const profile    = load()
    profile.seasonXP += xp
    const newLevel   = Math.min(
      CURRENT_SEASON.levels,
      Math.floor(profile.seasonXP / CURRENT_SEASON.xpPerLevel) + 1,
    )
    profile.seasonLevel = newLevel

    // Claim rewards for newly unlocked levels
    const newRewards: SeasonReward[] = []
    for (const reward of SEASON_REWARDS) {
      if (reward.level <= newLevel && !profile.claimedLevelRewards.includes(reward.level)) {
        profile.claimedLevelRewards.push(reward.level)
        CosmeticInventoryManager.unlock(reward.cosmeticId)
        newRewards.push(reward)
      }
    }

    persist(profile)
    return { profile, newRewards }
  },

  onMatchComplete(params: { won: boolean; coins: number }): void {
    const profile = load()
    profile.matchesPlayed++
    if (params.won) profile.wins++
    profile.coinsEarned += params.coins
    const xp = params.won ? 25 : 10
    persist(profile)
    this.addXP(xp)
  },

  async syncToFirebase(playerId: string): Promise<void> {
    await saveSeasonProfile(playerId, load())
  },

  async loadFromFirebase(playerId: string): Promise<void> {
    const remote = await fetchSeasonProfile(playerId, CURRENT_SEASON.id)
    if (remote && remote.seasonXP > load().seasonXP) persist(remote)
  },

  xpToNextLevel(profile: SeasonProfile): number {
    const xpIntoLevel = profile.seasonXP % CURRENT_SEASON.xpPerLevel
    return CURRENT_SEASON.xpPerLevel - xpIntoLevel
  },

  levelProgress(profile: SeasonProfile): number {
    return (profile.seasonXP % CURRENT_SEASON.xpPerLevel) / CURRENT_SEASON.xpPerLevel
  },
}

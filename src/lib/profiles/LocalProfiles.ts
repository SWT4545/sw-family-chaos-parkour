import type { LocalProfile } from '@/types/profile'
import type { CharacterId } from '@/types/player'

const STORAGE_KEY = 'swc-local-profiles'

// ─── Default profiles ─────────────────────────────────────────────────────────

const DEFAULT_PROFILES: LocalProfile[] = [
  {
    id: 'dad', playerName: 'Dad', selectedCharacterId: 'commander',
    totalCoins: 0, wins: 0, losses: 0, soloRuns: 0,
    bestSoloTime: null, favoriteCharacter: 'commander',
    unlockedTrails: [], unlockedEmotes: [], unlockedOutfits: [],
    createdAt: Date.now(), lastUpdated: Date.now(),
  },
  {
    id: 'bj', playerName: 'BJ', selectedCharacterId: 'bj',
    totalCoins: 0, wins: 0, losses: 0, soloRuns: 0,
    bestSoloTime: null, favoriteCharacter: 'bj',
    unlockedTrails: [], unlockedEmotes: [], unlockedOutfits: [],
    createdAt: Date.now(), lastUpdated: Date.now(),
  },
  {
    id: 'brae', playerName: 'Brae', selectedCharacterId: 'brae',
    totalCoins: 0, wins: 0, losses: 0, soloRuns: 0,
    bestSoloTime: null, favoriteCharacter: 'brae',
    unlockedTrails: [], unlockedEmotes: [], unlockedOutfits: [],
    createdAt: Date.now(), lastUpdated: Date.now(),
  },
  {
    id: 'xanny', playerName: 'Xanny', selectedCharacterId: 'xanny',
    totalCoins: 0, wins: 0, losses: 0, soloRuns: 0,
    bestSoloTime: null, favoriteCharacter: 'xanny',
    unlockedTrails: [], unlockedEmotes: [], unlockedOutfits: [],
    createdAt: Date.now(), lastUpdated: Date.now(),
  },
  {
    id: 'zaya', playerName: 'Zaya', selectedCharacterId: 'zaya',
    totalCoins: 0, wins: 0, losses: 0, soloRuns: 0,
    bestSoloTime: null, favoriteCharacter: 'zaya',
    unlockedTrails: [], unlockedEmotes: [], unlockedOutfits: [],
    createdAt: Date.now(), lastUpdated: Date.now(),
  },
]

// ─── Storage helpers ──────────────────────────────────────────────────────────

function load(): LocalProfile[] {
  if (typeof window === 'undefined') return DEFAULT_PROFILES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILES
    const parsed = JSON.parse(raw) as LocalProfile[]
    // Ensure all default profiles exist
    const ids = new Set(parsed.map((p) => p.id))
    for (const d of DEFAULT_PROFILES) {
      if (!ids.has(d.id)) parsed.push({ ...d, createdAt: Date.now(), lastUpdated: Date.now() })
    }
    return parsed
  } catch { return DEFAULT_PROFILES }
}

function save(profiles: LocalProfile[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)) } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const LocalProfiles = {
  getAll(): LocalProfile[] {
    return load()
  },

  getById(id: string): LocalProfile | null {
    return load().find((p) => p.id === id) ?? null
  },

  getByCharacter(charId: CharacterId): LocalProfile | null {
    return load().find((p) => p.selectedCharacterId === charId) ?? null
  },

  /** Record a solo run completion. time = elapsed seconds. */
  recordSoloRun(charId: CharacterId, time: number, coinsEarned: number): void {
    const profiles = load()
    const profile  = profiles.find((p) => p.selectedCharacterId === charId)
    if (!profile) return
    profile.soloRuns++
    profile.totalCoins  += coinsEarned
    profile.lastUpdated  = Date.now()
    if (profile.bestSoloTime === null || time < profile.bestSoloTime) {
      profile.bestSoloTime = time
    }
    save(profiles)
  },

  /** Record a 1v1 match result. */
  recordMatch(
    p1CharId: CharacterId,
    p2CharId: CharacterId,
    winnerId: 1 | 2,
    p1Coins: number,
    p2Coins: number,
  ): void {
    const profiles = load()
    const p1Profile = profiles.find((p) => p.selectedCharacterId === p1CharId)
    const p2Profile = profiles.find((p) => p.selectedCharacterId === p2CharId)
    const now = Date.now()

    if (p1Profile) {
      if (winnerId === 1) p1Profile.wins++; else p1Profile.losses++
      p1Profile.totalCoins += p1Coins
      p1Profile.lastUpdated = now
    }
    if (p2Profile) {
      if (winnerId === 2) p2Profile.wins++; else p2Profile.losses++
      p2Profile.totalCoins += p2Coins
      p2Profile.lastUpdated = now
    }
    save(profiles)
  },

  addCoins(charId: CharacterId, amount: number): void {
    const profiles = load()
    const p = profiles.find((pr) => pr.selectedCharacterId === charId)
    if (!p) return
    p.totalCoins  += amount
    p.lastUpdated  = Date.now()
    save(profiles)
  },

  spendCoins(amount: number): boolean {
    const profiles = load()
    const total = profiles.reduce((s, p) => s + p.totalCoins, 0)
    if (total < amount) return false
    let remaining = amount
    for (const p of profiles) {
      const spend = Math.min(p.totalCoins, remaining)
      p.totalCoins -= spend
      p.lastUpdated = Date.now()
      remaining -= spend
      if (remaining <= 0) break
    }
    save(profiles)
    return true
  },

  reset(): void {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  },
}

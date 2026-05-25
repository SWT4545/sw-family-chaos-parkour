import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import { XP_REWARDS } from '@/lib/game/profile/ProfileTypes'

export interface DailyChallenge {
  id:          string
  title:       string
  description: string
  icon:        string
  coinReward:  number
  xpReward:    number
  requirement: { type: string; count: number }
  completed:   boolean
  progress:    number
}

const LS_KEY = 'sw-daily-challenges-v2'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

interface DailyStore {
  date:       string
  completed:  string[]
  progress:   Record<string, number>
}

function loadStore(): DailyStore {
  if (typeof window === 'undefined') return { date: todayKey(), completed: [], progress: {} }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { date: todayKey(), completed: [], progress: {} }
    const s = JSON.parse(raw) as DailyStore
    // Reset if date changed
    if (s.date !== todayKey()) return { date: todayKey(), completed: [], progress: {} }
    return s
  } catch { return { date: todayKey(), completed: [], progress: {} } }
}

function saveStore(s: DailyStore): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch {}
}

const CHALLENGE_TEMPLATES = [
  {
    id: 'collect_coins',
    title: 'Coin Hunter',
    description: 'Collect 20 coins across any levels',
    icon: '💰',
    coinReward: 50,
    xpReward: XP_REWARDS.dailyChallenge,
    requirement: { type: 'coins', count: 20 },
  },
  {
    id: 'solo_run',
    title: 'Solo Warrior',
    description: 'Complete 1 solo level run',
    icon: '🏃',
    coinReward: 40,
    xpReward: XP_REWARDS.dailyChallenge,
    requirement: { type: 'solo_runs', count: 1 },
  },
  {
    id: 'win_match',
    title: 'Family Champ',
    description: 'Win 1 multiplayer match',
    icon: '🏆',
    coinReward: 60,
    xpReward: XP_REWARDS.dailyChallenge,
    requirement: { type: 'wins', count: 1 },
  },
  {
    id: 'no_trap_run',
    title: 'Clean Run',
    description: 'Complete a level without hitting any traps',
    icon: '🧹',
    coinReward: 75,
    xpReward: XP_REWARDS.dailyChallenge,
    requirement: { type: 'clean_runs', count: 1 },
  },
]

export const DailyChallengeService = {
  getChallenges(): DailyChallenge[] {
    const store = loadStore()
    return CHALLENGE_TEMPLATES.map(t => ({
      ...t,
      completed: store.completed.includes(t.id),
      progress:  store.progress[t.id] ?? 0,
    }))
  },

  updateProgress(type: string, amount: number): void {
    const store = loadStore()
    const matching = CHALLENGE_TEMPLATES.filter(t => t.requirement.type === type)
    for (const ch of matching) {
      if (store.completed.includes(ch.id)) continue
      store.progress[ch.id] = (store.progress[ch.id] ?? 0) + amount
    }
    saveStore(store)
  },

  async claimReward(playerId: string, challengeId: string): Promise<{ coins: number; xp: number } | null> {
    const store = loadStore()
    if (store.completed.includes(challengeId)) return null

    const template = CHALLENGE_TEMPLATES.find(t => t.id === challengeId)
    if (!template) return null

    const progress = store.progress[challengeId] ?? 0
    if (progress < template.requirement.count) return null

    store.completed.push(challengeId)
    saveStore(store)

    await PlayerProfileService.rewardDailyChallenge(
      playerId,
      template.coinReward,
      template.xpReward,
    )

    return { coins: template.coinReward, xp: template.xpReward }
  },

  isAllComplete(): boolean {
    const store = loadStore()
    return CHALLENGE_TEMPLATES.every(t => store.completed.includes(t.id))
  },

  getTotalRewardCoins(): number {
    return CHALLENGE_TEMPLATES.reduce((s, t) => s + t.coinReward, 0)
  },
}

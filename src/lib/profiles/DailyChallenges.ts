export interface DailyChallenge {
  id:          string
  title:       string
  description: string
  goal:        number
  reward:      number    // coins
  icon:        string
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'collect_coins',   title: 'Coin Hunter',    description: 'Collect 25 coins in any match',  goal: 25, reward: 20, icon: '💰' },
  { id: 'solo_run',        title: 'Solo Warrior',   description: 'Finish 1 solo run',               goal: 1,  reward: 20, icon: '🏃' },
  { id: 'powerup_use',     title: 'Power Up!',      description: 'Collect 3 powerups',              goal: 3,  reward: 20, icon: '⚡' },
  { id: 'taco_rain',       title: 'Taco Survivor',  description: 'Survive a Taco Rain event',       goal: 1,  reward: 20, icon: '🌮' },
]

function todayKey(): string {
  const d = new Date()
  return `swc-daily-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export interface DailyProgress {
  [challengeId: string]: number   // current progress toward goal
}

function loadProgress(): DailyProgress {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(todayKey())
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveProgress(p: DailyProgress): void {
  try { localStorage.setItem(todayKey(), JSON.stringify(p)) } catch {}
}

export const DailyChallenges = {
  getProgress(): DailyProgress {
    return loadProgress()
  },

  isComplete(challengeId: string): boolean {
    const p    = loadProgress()
    const ch   = DAILY_CHALLENGES.find((c) => c.id === challengeId)
    if (!ch) return false
    return (p[challengeId] ?? 0) >= ch.goal
  },

  increment(challengeId: string, amount = 1): { justCompleted: boolean; reward: number } {
    const ch = DAILY_CHALLENGES.find((c) => c.id === challengeId)
    if (!ch) return { justCompleted: false, reward: 0 }
    const p    = loadProgress()
    const prev = p[challengeId] ?? 0
    if (prev >= ch.goal) return { justCompleted: false, reward: 0 }
    p[challengeId] = Math.min(prev + amount, ch.goal)
    saveProgress(p)
    const justCompleted = p[challengeId] >= ch.goal
    return { justCompleted, reward: justCompleted ? ch.reward : 0 }
  },

  /** Called after a match ends. */
  onMatchComplete(opts: {
    mode:          'solo' | '1v1'
    coinsCollected: number
    powerupsUsed:   number
    survivedTacoRain: boolean
  }): void {
    const { coinsCollected, mode, powerupsUsed, survivedTacoRain } = opts
    if (coinsCollected > 0) this.increment('collect_coins', coinsCollected)
    if (mode === 'solo')    this.increment('solo_run')
    if (powerupsUsed > 0)  this.increment('powerup_use', powerupsUsed)
    if (survivedTacoRain)  this.increment('taco_rain')
  },
}

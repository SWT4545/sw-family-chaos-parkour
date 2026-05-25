export interface WeeklyEvent {
  id:          string
  title:       string
  description: string
  icon:        string
  startDate:   string   // ISO date
  endDate:     string
  modifier:    WeeklyModifier
  active:      boolean
}

export interface WeeklyModifier {
  coinMultiplier?:  number
  xpMultiplier?:    number
  trapFrequency?:   'double' | 'half' | 'off'
  theme?:           string
  label:            string
}

// Rotating weekly events (cycle by ISO week number)
const WEEKLY_EVENTS: WeeklyEvent[] = [
  {
    id: 'double_coins',
    title: 'Double Coin Weekend',
    description: 'Earn 2x coins from every level this week!',
    icon: '💰',
    startDate: '2026-05-25',
    endDate:   '2026-06-01',
    modifier:  { coinMultiplier: 2, label: '2x Coins' },
    active:    true,
  },
  {
    id: 'chaos_trap_week',
    title: 'Chaos Trap Week',
    description: 'Traps everywhere — double frequency all week!',
    icon: '💥',
    startDate: '2026-06-02',
    endDate:   '2026-06-09',
    modifier:  { trapFrequency: 'double', label: '2x Traps' },
    active:    true,
  },
  {
    id: 'suno_showcase',
    title: 'Suno Soundtrack Week',
    description: 'New Suno tracks available! Check the music menu.',
    icon: '🎵',
    startDate: '2026-06-09',
    endDate:   '2026-06-16',
    modifier:  { label: 'New Music' },
    active:    true,
  },
  {
    id: 'xp_surge',
    title: 'XP Surge Week',
    description: 'Earn 3x XP from all activities this week!',
    icon: '⭐',
    startDate: '2026-06-16',
    endDate:   '2026-06-23',
    modifier:  { xpMultiplier: 3, label: '3x XP' },
    active:    true,
  },
]

export const WeeklyEventService = {
  getCurrentEvent(): WeeklyEvent | null {
    const today = new Date().toISOString().slice(0, 10)
    return WEEKLY_EVENTS.find(e =>
      e.active && e.startDate <= today && today <= e.endDate
    ) ?? null
  },

  getModifier(): WeeklyModifier | null {
    return this.getCurrentEvent()?.modifier ?? null
  },

  applyCoinMultiplier(coins: number): number {
    const mod = this.getModifier()
    return mod?.coinMultiplier ? Math.round(coins * mod.coinMultiplier) : coins
  },

  applyXpMultiplier(xp: number): number {
    const mod = this.getModifier()
    return mod?.xpMultiplier ? Math.round(xp * mod.xpMultiplier) : xp
  },
}

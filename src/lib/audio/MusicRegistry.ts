import type { MusicTrackDef, MusicSlot } from './MusicTypes'

// Built-in tracks (local /public files, always available as fallback)
export const BUILTIN_TRACKS: MusicTrackDef[] = [
  {
    id: 'main-theme', title: 'Main Theme', artistSource: 'Built-in',
    slot: 'menu', localPath: '/game-assets/audio/music/main-theme.mp3',
    loop: true, volume: 0.7, mood: 'hype', energyLevel: 7, isActive: true,
  },
  {
    id: 'lobby-theme', title: 'Lobby Theme', artistSource: 'Built-in',
    slot: 'lobby', localPath: '/game-assets/audio/music/lobby-theme.mp3',
    loop: true, volume: 0.6, mood: 'chill', energyLevel: 4, isActive: true,
  },
  {
    id: 'race-theme', title: 'Race Theme', artistSource: 'Built-in',
    slot: 'race', localPath: '/game-assets/audio/music/race-theme.mp3',
    loop: true, volume: 0.75, mood: 'hype', energyLevel: 9, isActive: true,
  },
  {
    id: 'family-city', title: 'Family City', artistSource: 'Built-in',
    slot: 'familyCity', localPath: '/game-assets/audio/music/race-theme.mp3',
    loop: true, volume: 0.75, mood: 'hype', energyLevel: 8, isActive: true,
  },
  {
    id: 'victory-theme', title: 'Victory!', artistSource: 'Built-in',
    slot: 'victory', localPath: '/game-assets/audio/music/victory-theme.mp3',
    loop: false, volume: 0.8, mood: 'victory', energyLevel: 10, isActive: true,
  },
]

// Screen → slot mapping
export const SCREEN_SLOT_MAP: Record<string, MusicSlot> = {
  'main-menu':        'menu',
  'mode-select':      'menu',
  'world-select':     'worldSelect',
  'character-select': 'characterSelect',
  'level-select':     'worldSelect',
  'course-select':    'lobby',
  'lobby':            'lobby',
  'game':             'race',
  'victory':          'victory',
  'solo-victory':     'victory',
  'course-victory':   'victory',
  'leaderboard':      'leaderboard',
  'daily-challenges': 'hub',
  'online-gateway':   'lobby',
  'online-lobby':     'lobby',
}

export function builtinForSlot(slot: MusicSlot): MusicTrackDef | undefined {
  return BUILTIN_TRACKS.find(t => t.slot === slot && t.isActive)
}

// Fallback chain: if no track for exact slot, try parent slot
export const SLOT_FALLBACK: Partial<Record<MusicSlot, MusicSlot>> = {
  familyCity:  'race',
  chaosLabs:   'race',
  volcano:     'race',
  japanNeon:   'race',
  spaceStation:'race',
  dreamChaos:  'race',
  worldSelect: 'menu',
  characterSelect: 'menu',
  leaderboard: 'menu',
  hub:         'menu',
  boss:        'race',
  shop:        'menu',
  launchpad:   'menu',
}

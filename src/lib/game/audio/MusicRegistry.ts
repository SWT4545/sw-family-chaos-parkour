export type MusicScreen = 'mainMenu' | 'lobby' | 'race' | 'victory'

export interface MusicTrack {
  id:          string
  displayName: string
  src:         string        // path under /public
  screen:      MusicScreen
  loop:        boolean
  volume:      number        // 0-1, base volume before settings multiplier
}

export const MUSIC_REGISTRY: MusicTrack[] = [
  {
    id:          'main-theme',
    displayName: 'Main Theme',
    src:         '/game-assets/audio/music/main-theme.mp3',
    screen:      'mainMenu',
    loop:        true,
    volume:      0.7,
  },
  {
    id:          'lobby-theme',
    displayName: 'Lobby Theme',
    src:         '/game-assets/audio/music/lobby-theme.mp3',
    screen:      'lobby',
    loop:        true,
    volume:      0.6,
  },
  {
    id:          'race-theme',
    displayName: 'Race Theme',
    src:         '/game-assets/audio/music/race-theme.mp3',
    screen:      'race',
    loop:        true,
    volume:      0.75,
  },
  {
    id:          'victory-theme',
    displayName: 'Victory Theme',
    src:         '/game-assets/audio/music/victory-theme.mp3',
    screen:      'victory',
    loop:        false,
    volume:      0.8,
  },
]

export function trackForScreen(screen: MusicScreen): MusicTrack | undefined {
  return MUSIC_REGISTRY.find((t) => t.screen === screen)
}

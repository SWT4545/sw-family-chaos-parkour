import { MUSIC_REGISTRY, trackForScreen } from './MusicRegistry'
import type { MusicScreen } from './MusicRegistry'
import { getAudioSettings, updateAudioSettings } from './AudioSettings'

// Map screen names used in page.tsx → MusicScreen IDs
const SCREEN_MAP: Record<string, MusicScreen> = {
  'main-menu':        'mainMenu',
  'mode-select':      'mainMenu',
  'character-select': 'mainMenu',
  'lobby':            'lobby',
  'game':             'race',
  'victory':          'victory',
  'solo-victory':     'victory',
  'leaderboard':      'mainMenu',
  'daily-challenges': 'mainMenu',
}

class MusicManagerImpl {
  private elements = new Map<string, HTMLAudioElement>()
  private currentSrc: string | null = null
  private pendingScreen: string | null = null
  private unlocked = false

  constructor() {
    if (typeof window === 'undefined') return
    const unlock = () => {
      if (this.unlocked) return
      this.unlocked = true
      window.removeEventListener('click',      unlock)
      window.removeEventListener('keydown',    unlock)
      window.removeEventListener('touchstart', unlock)
      if (this.pendingScreen) {
        const s = this.pendingScreen
        this.pendingScreen = null
        this.playScreen(s)
      }
    }
    window.addEventListener('click',      unlock, { passive: true })
    window.addEventListener('keydown',    unlock)
    window.addEventListener('touchstart', unlock, { passive: true })
  }

  private getEl(src: string, loop: boolean, baseVol: number): HTMLAudioElement {
    let el = this.elements.get(src)
    if (!el) {
      el = new Audio(src)
      el.loop   = loop
      el.volume = this.computeVolume(baseVol)
      el.muted  = getAudioSettings().musicMuted
      this.elements.set(src, el)
    }
    return el
  }

  private computeVolume(baseVol: number): number {
    return baseVol * getAudioSettings().musicVolume
  }

  playScreen(screenId: string): void {
    if (typeof window === 'undefined') return
    const musicScreen = SCREEN_MAP[screenId]
    if (!musicScreen) return
    const track = trackForScreen(musicScreen)
    if (!track) return

    if (!this.unlocked) {
      this.pendingScreen = screenId
      return
    }

    if (this.currentSrc === track.src) return

    // Stop current track
    if (this.currentSrc) {
      const prev = this.elements.get(this.currentSrc)
      if (prev) { prev.pause(); prev.currentTime = 0 }
    }

    const el = this.getEl(track.src, track.loop, track.volume)
    el.currentTime = 0
    el.play().catch(() => {
      // File missing or autoplay blocked — silently continue
    })
    this.currentSrc = track.src
  }

  setMuted(muted: boolean): void {
    updateAudioSettings({ musicMuted: muted })
    this.elements.forEach((el) => { el.muted = muted })
  }

  setVolume(vol: number): void {
    updateAudioSettings({ musicVolume: vol })
    for (const [src, el] of this.elements) {
      const track = MUSIC_REGISTRY.find((t) => t.src === src)
      if (track) el.volume = this.computeVolume(track.volume)
    }
  }

  isMuted(): boolean   { return getAudioSettings().musicMuted }
  getVolume(): number  { return getAudioSettings().musicVolume }
}

export const MusicManager = new MusicManagerImpl()

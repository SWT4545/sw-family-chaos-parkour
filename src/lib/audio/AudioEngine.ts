'use client'
import type { MusicSlot, MusicTrackDef } from './MusicTypes'
import { BUILTIN_TRACKS, SCREEN_SLOT_MAP, builtinForSlot, SLOT_FALLBACK } from './MusicRegistry'
import { CrossfadeService } from './CrossfadeService'

const LS_VOLUME = 'sw-audio-volume'
const LS_MUTED  = 'sw-audio-muted'

class AudioEngineImpl {
  private elements   = new Map<string, HTMLAudioElement>()
  private currentEl:  HTMLAudioElement | null = null
  private currentSrc: string | null = null
  private crossfader  = new CrossfadeService()
  private unlocked    = false
  private pendingSlot: MusicSlot | null = null

  // Firestore-loaded tracks (injected by MusicService after fetch)
  private remoteTracks: MusicTrackDef[] = []

  constructor() {
    if (typeof window === 'undefined') return
    const unlock = () => {
      if (this.unlocked) return
      this.unlocked = true
      window.removeEventListener('click',      unlock)
      window.removeEventListener('keydown',    unlock)
      window.removeEventListener('touchstart', unlock)
      if (this.pendingSlot) {
        const s = this.pendingSlot
        this.pendingSlot = null
        this.playSlot(s)
      }
    }
    window.addEventListener('click',      unlock, { passive: true })
    window.addEventListener('keydown',    unlock)
    window.addEventListener('touchstart', unlock, { passive: true })
  }

  // ── Settings ──
  getVolume(): number { return parseFloat(localStorage.getItem(LS_VOLUME) ?? '0.7') }
  isMuted():   boolean { return localStorage.getItem(LS_MUTED) === 'true' }

  setVolume(v: number): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_VOLUME, String(v))
    this.elements.forEach(el => { el.volume = this.computedVolume(el) })
  }

  setMuted(m: boolean): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LS_MUTED, String(m))
    this.elements.forEach(el => { el.muted = m })
  }

  private computedVolume(el: HTMLAudioElement & { _baseVol?: number }): number {
    return (el._baseVol ?? 0.75) * this.getVolume()
  }

  // ── Track resolution ──
  private resolveTrack(slot: MusicSlot): MusicTrackDef | undefined {
    // 1. Check remote tracks first
    const remote = this.remoteTracks.find(t => t.slot === slot && t.isActive)
    if (remote) return remote
    // 2. Builtin
    const builtin = builtinForSlot(slot)
    if (builtin) return builtin
    // 3. Fallback slot
    const fallback = SLOT_FALLBACK[slot]
    if (fallback) return this.resolveTrack(fallback)
    return undefined
  }

  // ── Load and cache an audio element ──
  private getEl(track: MusicTrackDef): HTMLAudioElement & { _baseVol?: number } {
    const src = track.downloadUrl ?? track.localPath ?? ''
    let el = this.elements.get(src) as (HTMLAudioElement & { _baseVol?: number }) | undefined
    if (!el) {
      el = new Audio(src) as HTMLAudioElement & { _baseVol?: number }
      el._baseVol = track.volume
      el.loop     = track.loop
      el.volume   = this.computedVolume(el)
      el.muted    = this.isMuted()
      this.elements.set(src, el)
    }
    return el
  }

  // ── Play by slot ──
  playSlot(slot: MusicSlot): void {
    if (typeof window === 'undefined') return
    if (!this.unlocked) { this.pendingSlot = slot; return }

    const track = this.resolveTrack(slot)
    if (!track) return
    const src = track.downloadUrl ?? track.localPath ?? ''
    if (!src || this.currentSrc === src) return

    const next = this.getEl(track)
    next.currentTime = 0

    this.crossfader.crossfade(this.currentEl, next, this.computedVolume(next))
    this.currentEl  = next
    this.currentSrc = src
  }

  // ── Play by screen name (for backward compat with existing page.tsx) ──
  playScreen(screenName: string): void {
    const slot = SCREEN_SLOT_MAP[screenName]
    if (slot) this.playSlot(slot)
  }

  // ── Play by world ──
  playWorld(worldId: string): void {
    const slotMap: Record<string, MusicSlot> = {
      world1: 'familyCity',
      world2: 'chaosLabs',
      world3: 'volcano',
      world4: 'japanNeon',
      world5: 'spaceStation',
      world6: 'dreamChaos',
    }
    const slot = slotMap[worldId]
    if (slot) this.playSlot(slot)
  }

  // ── Stop all ──
  stop(): void {
    this.crossfader.stop()
    if (this.currentEl) {
      this.crossfader.fadeOut(this.currentEl, 300)
      this.currentEl  = null
      this.currentSrc = null
    }
  }

  // ── Inject remote tracks from Firestore (called by MusicService) ──
  injectRemoteTracks(tracks: MusicTrackDef[]): void {
    this.remoteTracks = tracks
  }
}

export const AudioEngine = new AudioEngineImpl()

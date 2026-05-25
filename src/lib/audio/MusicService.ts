import { collection, getDocs, query, where } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firebaseConfig'
import { AudioEngine } from './AudioEngine'
import type { MusicTrackDef } from './MusicTypes'

const COLL = 'musicTracks'

export const MusicService = {
  // ── Load active tracks from Firestore and inject into AudioEngine ──
  async loadRemoteTracks(gameId?: string): Promise<void> {
    const db = getDb()
    if (!db) return
    try {
      const constraints = [where('isActive', '==', true)]
      if (gameId) constraints.push(where('gameId', '==', gameId))
      const snap = await getDocs(query(collection(db, COLL), ...constraints))
      const tracks = snap.docs.map(d => d.data() as MusicTrackDef)
      AudioEngine.injectRemoteTracks(tracks)
    } catch {}
  },

  // ── Play for a screen (delegates to AudioEngine) ──
  playScreen(screenName: string): void {
    AudioEngine.playScreen(screenName)
  },

  // ── Play for a world ──
  playWorld(worldId: string): void {
    AudioEngine.playWorld(worldId)
  },

  // ── Volume / mute ──
  setVolume(v: number): void { AudioEngine.setVolume(v) },
  setMuted(m: boolean): void { AudioEngine.setMuted(m) },
  getVolume(): number        { return AudioEngine.getVolume() },
  isMuted(): boolean         { return AudioEngine.isMuted() },
  stop(): void               { AudioEngine.stop() },
}

import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'
import { getStorageInstance, getDb } from './firebaseConfig'

const MUSIC_PATH  = 'music'
const MUSIC_COLL  = 'swfcp_musicRegistry'

export interface MusicTrack {
  id:        string   // 'main-theme' | 'lobby-theme' | 'race-theme' | 'victory-theme' | custom
  name:      string
  url:       string
  loop:      boolean
  uploadedAt: number
}

export async function uploadMusicTrack(
  file: File,
  trackId: string,
  trackName: string,
  loop: boolean,
): Promise<MusicTrack | null> {
  const storage = getStorageInstance()
  const db      = getDb()
  if (!storage || !db) return null

  try {
    const path      = `${MUSIC_PATH}/${trackId}.mp3`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file, { contentType: 'audio/mpeg' })
    const url = await getDownloadURL(storageRef)

    const track: MusicTrack = { id: trackId, name: trackName, url, loop, uploadedAt: Date.now() }
    await setDoc(doc(db, MUSIC_COLL, trackId), track)
    return track
  } catch (e) {
    console.error('Music upload failed', e)
    return null
  }
}

export async function fetchMusicRegistry(): Promise<MusicTrack[]> {
  const db = getDb()
  if (!db) return []
  try {
    const snaps = await getDocs(collection(db, MUSIC_COLL))
    return snaps.docs.map(d => d.data() as MusicTrack)
  } catch { return [] }
}

export async function deleteMusicTrack(trackId: string): Promise<void> {
  const storage = getStorageInstance()
  const db      = getDb()
  if (!storage || !db) return
  try {
    await deleteObject(ref(storage, `${MUSIC_PATH}/${trackId}.mp3`))
    await import('firebase/firestore').then(({ deleteDoc }) =>
      deleteDoc(doc(db, MUSIC_COLL, trackId))
    )
  } catch {}
}

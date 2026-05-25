import {
  collection, doc, setDoc, query, orderBy, limit, getDocs, where,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firebaseConfig'
import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import type { LeaderboardCategory, LeaderboardEntry, LeaderboardPage } from './LeaderboardTypes'

const BASE_COLL = 'leaderboards'

function entryId(category: LeaderboardCategory, playerId: string): string {
  return `${category}_${playerId}`
}

function collPath(category: LeaderboardCategory): string {
  return `${BASE_COLL}/${category}/entries`
}

// ── Submit ──────────────────────────────────────────────────────────────────

export async function submitEntry(
  entry: Omit<LeaderboardEntry, 'entryId' | 'createdAt' | 'updatedAt'> & { createdAt?: number },
): Promise<void> {
  const db = getDb()
  if (!db) return
  const now = Date.now()
  const id  = entryId(entry.category, entry.playerId)

  try {
    const full: LeaderboardEntry = {
      ...entry,
      entryId:   id,
      createdAt: entry.createdAt ?? now,
      updatedAt: now,
    }

    // For solo-time: only overwrite if new score is better (lower)
    if (entry.category === 'solo-time') {
      const { getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, collPath(entry.category), id))
      if (snap.exists()) {
        const existing = snap.data() as LeaderboardEntry
        if (existing.score <= entry.score) return  // existing is better or equal
      }
    }

    await setDoc(doc(db, collPath(entry.category), id), full)
  } catch {}
}

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  category: LeaderboardCategory,
  maxEntries = 20,
): Promise<LeaderboardPage> {
  const db       = getDb()
  const ascOrder = category === 'solo-time'

  if (db) {
    try {
      const q    = query(
        collection(db, collPath(category)),
        orderBy('score', ascOrder ? 'asc' : 'desc'),
        limit(maxEntries),
      )
      const snap = await getDocs(q)
      const entries = snap.docs.map(d => d.data() as LeaderboardEntry)
      if (entries.length > 0) {
        return { category, entries, source: 'firebase', fetchedAt: Date.now() }
      }
    } catch {}
  }

  // Fallback: build from local profile
  const profile = PlayerProfileService.getCurrent()
  const entries: LeaderboardEntry[] = []
  if (profile) {
    const now = Date.now()
    if (category === 'wins' && profile.wins > 0) {
      entries.push({
        entryId:     entryId(category, profile.playerId),
        playerId:    profile.playerId,
        displayName: profile.displayName,
        characterId: profile.selectedCharacterId,
        score:       profile.wins,
        category,
        createdAt:   now,
        updatedAt:   now,
      })
    }
    if (category === 'coins' && profile.totalCoinsEarned > 0) {
      entries.push({
        entryId:     entryId(category, profile.playerId),
        playerId:    profile.playerId,
        displayName: profile.displayName,
        characterId: profile.selectedCharacterId,
        score:       profile.totalCoinsEarned,
        category,
        createdAt:   now,
        updatedAt:   now,
      })
    }
    if (category === 'solo-time') {
      for (const [courseId, ms] of Object.entries(profile.bestTimesByCourse)) {
        if (ms > 0) {
          entries.push({
            entryId:     `${category}_${profile.playerId}_${courseId}`,
            playerId:    profile.playerId,
            displayName: profile.displayName,
            characterId: profile.selectedCharacterId,
            score:       ms,
            category,
            courseId,
            createdAt:   now,
            updatedAt:   now,
          })
        }
      }
      entries.sort((a, b) => a.score - b.score)
    }
  }

  return { category, entries, source: 'local', fetchedAt: Date.now() }
}

// ── Sync current profile to all categories ────────────────────────────────────

export async function syncProfileToLeaderboards(playerId: string): Promise<void> {
  const profile = PlayerProfileService.getCurrent()
  if (!profile || profile.playerId !== playerId) return
  const now = Date.now()

  const base = {
    playerId:    profile.playerId,
    displayName: profile.displayName,
    characterId: profile.selectedCharacterId,
    createdAt:   now,
  }

  await Promise.all([
    profile.wins > 0
      ? submitEntry({ ...base, category: 'wins', score: profile.wins })
      : Promise.resolve(),
    profile.totalCoinsEarned > 0
      ? submitEntry({ ...base, category: 'coins', score: profile.totalCoinsEarned })
      : Promise.resolve(),
    ...Object.entries(profile.bestTimesByCourse).map(([courseId, ms]) =>
      ms > 0
        ? submitEntry({ ...base, category: 'solo-time', score: ms, courseId, timeMs: ms })
        : Promise.resolve(),
    ),
  ])
}

import type { CourseDifficulty } from '@/types/game'

const KEY = 'swfcp_course_progression'

export interface CourseProgress {
  courseId: string
  unlockedDifficulties: CourseDifficulty[]
  completedRuns: {
    difficulty: CourseDifficulty
    time: number
    coins: number
    completedAt: number
  }[]
  bestTimes: Partial<Record<CourseDifficulty, number>>
  bestDifficultyCompleted?: CourseDifficulty
  earnedBadges: string[]
}

export interface CourseProgressionState {
  unlockedCourseIds: string[]
  courseProgress: Record<string, CourseProgress>
}

const DIFFICULTY_ORDER: CourseDifficulty[] = ['easy', 'medium', 'hard', 'master']

function defaultState(firstCourseId: string): CourseProgressionState {
  return {
    unlockedCourseIds: [firstCourseId],
    courseProgress: {
      [firstCourseId]: {
        courseId: firstCourseId,
        unlockedDifficulties: ['easy'],
        completedRuns: [],
        bestTimes: {},
        earnedBadges: [],
      },
    },
  }
}

export class CourseProgressionService {
  static load(firstCourseId: string): CourseProgressionState {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) return JSON.parse(stored) as CourseProgressionState
    } catch {}
    const state = defaultState(firstCourseId)
    CourseProgressionService.save(state)
    return state
  }

  static save(state: CourseProgressionState): void {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }

  static recordCompletion(params: {
    state: CourseProgressionState
    courseId: string
    nextCourseId: string | null
    difficulty: CourseDifficulty
    time: number
    coins: number
  }): { state: CourseProgressionState; newCourseUnlocked: boolean; newDifficultyUnlocked: boolean; badgeEarned?: string } {
    const { state, courseId, nextCourseId, difficulty, time, coins } = params
    const s = { ...state, courseProgress: { ...state.courseProgress } }

    let progress = s.courseProgress[courseId] ?? {
      courseId, unlockedDifficulties: ['easy' as CourseDifficulty],
      completedRuns: [], bestTimes: {}, earnedBadges: [],
    }

    // Record run
    progress = {
      ...progress,
      completedRuns: [...progress.completedRuns, { difficulty, time, coins, completedAt: Date.now() }],
      bestTimes: {
        ...progress.bestTimes,
        [difficulty]: progress.bestTimes[difficulty] ? Math.min(progress.bestTimes[difficulty]!, time) : time,
      },
    }

    // Unlock next difficulty on this course
    const currentIdx = DIFFICULTY_ORDER.indexOf(difficulty)
    const nextDifficulty = DIFFICULTY_ORDER[currentIdx + 1]
    let newDifficultyUnlocked = false
    if (nextDifficulty && !progress.unlockedDifficulties.includes(nextDifficulty)) {
      progress = { ...progress, unlockedDifficulties: [...progress.unlockedDifficulties, nextDifficulty] }
      newDifficultyUnlocked = true
    }

    // Track best difficulty
    const diffRank = DIFFICULTY_ORDER.indexOf(difficulty)
    const currentBestRank = progress.bestDifficultyCompleted
      ? DIFFICULTY_ORDER.indexOf(progress.bestDifficultyCompleted)
      : -1
    if (diffRank > currentBestRank) {
      progress = { ...progress, bestDifficultyCompleted: difficulty }
    }

    // Master badge
    let badgeEarned: string | undefined
    if (difficulty === 'master' && !progress.earnedBadges.includes('master-runner')) {
      progress = { ...progress, earnedBadges: [...progress.earnedBadges, 'master-runner'] }
      badgeEarned = 'master-runner'
    }

    s.courseProgress[courseId] = progress

    // Unlock next course on easy completion
    let newCourseUnlocked = false
    if (nextCourseId && !s.unlockedCourseIds.includes(nextCourseId)) {
      s.unlockedCourseIds = [...s.unlockedCourseIds, nextCourseId]
      s.courseProgress[nextCourseId] = {
        courseId: nextCourseId,
        unlockedDifficulties: ['easy'],
        completedRuns: [], bestTimes: {}, earnedBadges: [],
      }
      newCourseUnlocked = true
    }

    CourseProgressionService.save(s)
    return { state: s, newCourseUnlocked, newDifficultyUnlocked, badgeEarned }
  }
}

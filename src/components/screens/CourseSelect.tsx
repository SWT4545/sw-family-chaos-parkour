'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Lock, Trophy, Clock, Coins, ChevronRight } from 'lucide-react'
import type { CourseDef, CourseDifficulty } from '@/types/game'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { ALL_COURSES } from '@/lib/game/maps/courses'
import { CourseProgressionService } from '@/lib/profiles/CourseProgression'
import type { CourseProgressionState } from '@/lib/profiles/CourseProgression'

interface Props {
  onSelect:      (course: CourseDef, difficulty: CourseDifficulty) => void
  onBack:        () => void
  playerNumber?: 1 | 2
}

const DIFF_ORDER: CourseDifficulty[] = ['easy', 'medium', 'hard', 'master']

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// ID of the first course — used as the always-unlocked anchor
const FIRST_COURSE_ID = ALL_COURSES[0]?.id ?? 'rooftop-run'

export function CourseSelect({ onSelect, onBack, playerNumber }: Props) {
  const [progression,    setProgression]    = useState<CourseProgressionState | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<CourseDef | null>(null)
  const [selectedDiff,   setSelectedDiff]   = useState<CourseDifficulty>('easy')
  const [lockMsg,        setLockMsg]        = useState<string | null>(null)
  const lockMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load progression and auto-select first unlocked course
  useEffect(() => {
    const state = CourseProgressionService.load(FIRST_COURSE_ID)
    setProgression(state)

    // Auto-select: pick the first course the player can actually play
    const firstUnlocked = ALL_COURSES.find(c => state.unlockedCourseIds.includes(c.id))
    if (firstUnlocked) {
      setSelectedCourse(firstUnlocked)
      // Auto-select first unlocked difficulty for this course
      const progress = state.courseProgress[firstUnlocked.id]
      const firstDiff = progress?.unlockedDifficulties?.[0] ?? 'easy'
      setSelectedDiff(firstDiff)
    }
  }, [])

  const isCourseUnlocked = (c: CourseDef) =>
    !progression ? c.courseNumber === 1 : progression.unlockedCourseIds.includes(c.id)

  const isDiffUnlocked = (c: CourseDef, d: CourseDifficulty) => {
    if (!progression) return d === 'easy'
    const p = progression.courseProgress[c.id]
    return p ? p.unlockedDifficulties.includes(d) : d === 'easy'
  }

  const handleCourseTap = (course: CourseDef) => {
    if (!isCourseUnlocked(course)) {
      if (lockMsgTimer.current) clearTimeout(lockMsgTimer.current)
      setLockMsg(`Complete Course ${course.courseNumber - 1} on Easy to unlock`)
      lockMsgTimer.current = setTimeout(() => setLockMsg(null), 2400)
      return
    }
    setSelectedCourse(course)
    // Pick first unlocked difficulty for the newly selected course
    const progress = progression?.courseProgress[course.id]
    const firstDiff = progress?.unlockedDifficulties?.[0] ?? 'easy'
    setSelectedDiff(firstDiff)
  }

  const canPlay = selectedCourse !== null && isCourseUnlocked(selectedCourse)
  const unlockedCount = progression ? progression.unlockedCourseIds.length : 1

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-yellow-500/6 blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>

        <div className="text-center">
          {playerNumber && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold mb-0.5">
              Player {playerNumber}
            </p>
          )}
          <h1 className="text-lg font-black uppercase tracking-widest text-white leading-tight">
            Select Course
          </h1>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {unlockedCount} / {ALL_COURSES.length} unlocked
          </p>
        </div>

        <div className="w-20" />
      </div>

      {/* ── Active course summary bar ── */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 overflow-hidden"
          >
            <div
              className="mx-4 mt-3 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(251,191,36,0.07)',
                border:     '1px solid rgba(251,191,36,0.20)',
              }}
            >
              {/* Course number */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
              >
                {selectedCourse.courseNumber}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm uppercase tracking-wide truncate">
                  {selectedCourse.name}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{selectedCourse.subtitle}</p>
              </div>
              {/* Difficulty pill */}
              <div
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${DIFFICULTY_CONFIGS[selectedDiff].color}20`,
                  color:      DIFFICULTY_CONFIGS[selectedDiff].color,
                  border:     `1px solid ${DIFFICULTY_CONFIGS[selectedDiff].color}40`,
                }}
              >
                {DIFFICULTY_CONFIGS[selectedDiff].label}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lock toast ── */}
      <AnimatePresence>
        {lockMsg && (
          <motion.div
            key="lockmsg"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 mx-4 mt-2 rounded-xl px-4 py-2.5 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <Lock size={13} className="text-red-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-300">{lockMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scroll hint ── */}
      <div className="relative z-10 flex items-center gap-2 px-5 mt-3 mb-1">
        <p className="text-[10px] text-gray-700 uppercase tracking-wider font-bold flex-1">
          Courses
        </p>
        <ChevronRight size={12} className="text-gray-700" />
        <p className="text-[10px] text-gray-700 font-medium">scroll to see all</p>
      </div>

      {/* ── Course list ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-2">
        <div className="max-w-2xl mx-auto space-y-2.5 pt-1 pb-2">
          {ALL_COURSES.map((course, idx) => {
            const unlocked  = isCourseUnlocked(course)
            const selected  = selectedCourse?.id === course.id
            const progress  = progression?.courseProgress[course.id]
            const bestDiff  = progress?.bestDifficultyCompleted
            const bestCfg   = bestDiff ? DIFFICULTY_CONFIGS[bestDiff] : null

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.06, ease: 'easeOut' }}
              >
                {/* Course card */}
                <button
                  onClick={() => handleCourseTap(course)}
                  className="w-full text-left rounded-2xl border transition-all duration-200 relative overflow-hidden"
                  style={{
                    backgroundColor: selected
                      ? 'rgba(251,191,36,0.07)'
                      : unlocked
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.35)',
                    borderColor: selected
                      ? 'rgba(251,191,36,0.50)'
                      : unlocked
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    boxShadow: selected ? '0 0 20px rgba(251,191,36,0.12)' : 'none',
                  }}
                >
                  <div className="p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Number badge */}
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                        style={{
                          background: unlocked ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                          color:      unlocked ? '#fbbf24' : '#333',
                          border:     `1.5px solid ${unlocked ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.05)'}`,
                        }}
                      >
                        {unlocked ? course.courseNumber : <Lock size={14} color="#444" />}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-black text-sm uppercase leading-tight tracking-wide"
                          style={{ color: unlocked ? '#fff' : '#333' }}
                        >
                          {course.name}
                        </h3>
                        <p className="text-[10px] mt-0.5" style={{ color: unlocked ? '#666' : '#2a2a2a' }}>
                          {unlocked ? course.subtitle : `Locked — complete Course ${course.courseNumber - 1}`}
                        </p>
                      </div>

                      {/* Best badge */}
                      {unlocked && bestDiff && bestCfg && (
                        <div
                          className="flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                          style={{ background: `${bestCfg.color}18`, color: bestCfg.color, border: `1px solid ${bestCfg.color}35` }}
                        >
                          {bestCfg.label}
                        </div>
                      )}
                      {unlocked && !bestDiff && (
                        <Trophy size={14} color="#333" className="flex-shrink-0" />
                      )}
                    </div>

                    {/* Best time row */}
                    {unlocked && progress && bestDiff && progress.bestTimes[bestDiff] && (
                      <div className="flex items-center gap-1 mt-2 ml-12">
                        <Clock size={10} color="#555" />
                        <span className="text-[10px] text-gray-600 font-medium">
                          Best: {fmtTime(progress.bestTimes[bestDiff]!)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Difficulty picker — inline under selected course */}
                <AnimatePresence>
                  {selected && unlocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-1.5 rounded-xl px-3 py-3"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-2">
                          Difficulty
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {DIFF_ORDER.map((diff) => {
                            const cfg          = DIFFICULTY_CONFIGS[diff]
                            const diffUnlocked = isDiffUnlocked(course, diff)
                            const isActive     = selectedDiff === diff

                            return (
                              <button
                                key={diff}
                                onClick={() => diffUnlocked && setSelectedDiff(diff)}
                                disabled={!diffUnlocked}
                                className="rounded-xl py-2.5 text-center transition-all duration-150 relative"
                                style={{
                                  background:    isActive ? `${cfg.color}22` : diffUnlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)',
                                  borderWidth:  '1.5px',
                                  borderStyle:  'solid',
                                  borderColor:   isActive ? cfg.color : diffUnlocked ? `${cfg.color}35` : 'rgba(255,255,255,0.04)',
                                  boxShadow:     isActive ? `0 0 12px ${cfg.color}28` : 'none',
                                  cursor:        diffUnlocked ? 'pointer' : 'not-allowed',
                                  opacity:       diffUnlocked ? 1 : 0.38,
                                }}
                              >
                                {!diffUnlocked && <Lock size={9} color="#444" className="mx-auto mb-0.5" />}
                                <div
                                  className="font-black text-[10px] uppercase tracking-wide"
                                  style={{ color: diffUnlocked ? cfg.color : '#333' }}
                                >
                                  {cfg.label}
                                </div>
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  <Coins size={7} color={diffUnlocked ? '#fbbf24' : '#333'} />
                                  <span className="text-[8px] font-bold" style={{ color: diffUnlocked ? '#fbbf24' : '#333' }}>
                                    x{cfg.coinMultiplier}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {/* Coin hint */}
                        <p className="text-[10px] text-yellow-500/60 text-center mt-2 font-medium">
                          x{DIFFICULTY_CONFIGS[selectedDiff].coinMultiplier} coin multiplier
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Start button — always visible ── */}
      <div
        className="relative z-10 flex-shrink-0 px-4 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <motion.button
          onClick={() => {
            if (canPlay) onSelect(selectedCourse!, selectedDiff)
          }}
          disabled={!canPlay}
          className="w-full rounded-2xl font-black text-base uppercase tracking-widest transition-all duration-200"
          style={{
            height:          '60px',
            backgroundColor: canPlay ? '#fbbf24' : 'rgba(255,255,255,0.06)',
            color:           canPlay ? '#0a0a0a' : '#333',
            border:          canPlay ? 'none' : '1px solid rgba(255,255,255,0.06)',
            cursor:          canPlay ? 'pointer' : 'not-allowed',
            boxShadow:       canPlay ? '0 0 24px rgba(251,191,36,0.30)' : 'none',
          }}
          whileHover={canPlay ? { scale: 1.02 } : {}}
          whileTap={canPlay   ? { scale: 0.97 } : {}}
        >
          {canPlay
            ? `START COURSE — ${DIFFICULTY_CONFIGS[selectedDiff].label}`
            : 'SELECT A COURSE TO START'}
        </motion.button>
      </div>
    </div>
  )
}

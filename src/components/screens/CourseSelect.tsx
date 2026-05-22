'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Lock, Trophy, Clock, Coins } from 'lucide-react'
import type { CourseDef, CourseDifficulty } from '@/types/game'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { ALL_COURSES } from '@/lib/game/maps/courses'
import { CourseProgressionService } from '@/lib/profiles/CourseProgression'
import type { CourseProgressionState } from '@/lib/profiles/CourseProgression'

interface Props {
  onSelect: (course: CourseDef, difficulty: CourseDifficulty) => void
  onBack: () => void
  playerNumber?: 1 | 2
}

const DIFFICULTY_ORDER: CourseDifficulty[] = ['easy', 'medium', 'hard', 'master']

function fmtTime(s: number): string {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function CourseSelect({ onSelect, onBack, playerNumber }: Props) {
  const [progression,        setProgression]        = useState<CourseProgressionState | null>(null)
  const [selectedCourse,     setSelectedCourse]     = useState<CourseDef | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<CourseDifficulty | null>(null)

  useEffect(() => {
    const state = CourseProgressionService.load('rooftop-run')
    setProgression(state)
  }, [])

  const isCourseUnlocked = (course: CourseDef): boolean => {
    if (!progression) return course.courseNumber === 1
    return progression.unlockedCourseIds.includes(course.id)
  }

  const isDifficultyUnlocked = (course: CourseDef, diff: CourseDifficulty): boolean => {
    if (!progression) return diff === 'easy'
    const progress = progression.courseProgress[course.id]
    if (!progress) return diff === 'easy'
    return progress.unlockedDifficulties.includes(diff)
  }

  const getCourseProgress = (course: CourseDef) => {
    if (!progression) return null
    return progression.courseProgress[course.id] ?? null
  }

  const canPlay = selectedCourse && selectedDifficulty

  return (
    <div
      className="relative min-h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-yellow-500/8 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-500/6 blur-[140px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
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
          <h1 className="text-xl font-black uppercase tracking-widest text-white leading-tight">
            Select Course
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {progression ? progression.unlockedCourseIds.length : 1} / {ALL_COURSES.length} unlocked
          </p>
        </div>

        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Course cards */}
          {ALL_COURSES.map((course, idx) => {
            const unlocked  = isCourseUnlocked(course)
            const progress  = getCourseProgress(course)
            const selected  = selectedCourse?.id === course.id
            const bestDiff  = progress?.bestDifficultyCompleted
            const bestDiffConfig = bestDiff ? DIFFICULTY_CONFIGS[bestDiff] : null

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.07, ease: 'easeOut' }}
              >
                <button
                  onClick={() => {
                    if (!unlocked) return
                    setSelectedCourse(course)
                    setSelectedDifficulty(null)
                  }}
                  disabled={!unlocked}
                  className="w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden"
                  style={{
                    backgroundColor: selected
                      ? 'rgba(251,191,36,0.07)'
                      : unlocked
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.4)',
                    borderColor: selected
                      ? '#fbbf24'
                      : unlocked
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    boxShadow: selected ? '0 0 24px rgba(251,191,36,0.15)' : 'none',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  {/* Lock overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-1.5">
                        <Lock size={20} className="text-gray-600" />
                        <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider text-center px-4">
                          Complete Course {course.courseNumber - 1} on Easy to unlock
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Course number badge */}
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                        style={{
                          backgroundColor: unlocked ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                          color: unlocked ? '#fbbf24' : '#444',
                          border: `1.5px solid ${unlocked ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {course.courseNumber}
                      </div>

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-black text-sm uppercase leading-tight tracking-wide"
                          style={{ color: unlocked ? '#fff' : '#333' }}
                        >
                          {course.name}
                        </h3>
                        <p
                          className="text-[11px] font-semibold mt-0.5"
                          style={{ color: unlocked ? '#888' : '#333' }}
                        >
                          {course.subtitle}
                        </p>
                        <p
                          className="text-[10px] mt-1.5 leading-relaxed"
                          style={{ color: unlocked ? '#555' : '#2a2a2a' }}
                        >
                          {course.description}
                        </p>
                      </div>

                      {/* Best stats */}
                      {unlocked && progress && bestDiff && (
                        <div className="flex-shrink-0 text-right">
                          <div
                            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-1"
                            style={{
                              backgroundColor: `${bestDiffConfig!.color}20`,
                              color: bestDiffConfig!.color,
                              border: `1px solid ${bestDiffConfig!.color}40`,
                            }}
                          >
                            {bestDiffConfig!.label}
                          </div>
                          {progress.bestTimes[bestDiff] && (
                            <div className="flex items-center gap-1 justify-end text-gray-500 text-[10px]">
                              <Clock size={9} />
                              <span>{fmtTime(progress.bestTimes[bestDiff]!)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {unlocked && !progress?.bestDifficultyCompleted && (
                        <div className="flex-shrink-0">
                          <Trophy size={14} className="text-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Difficulty picker — shown when this course is selected */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 px-1">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2 px-1">
                          Select Difficulty
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {DIFFICULTY_ORDER.map((diff) => {
                            const config   = DIFFICULTY_CONFIGS[diff]
                            const diffUnlocked = isDifficultyUnlocked(course, diff)
                            const isSelected   = selectedDifficulty === diff

                            return (
                              <button
                                key={diff}
                                onClick={() => diffUnlocked && setSelectedDifficulty(diff)}
                                disabled={!diffUnlocked}
                                className="relative rounded-xl p-2.5 text-center transition-all duration-150"
                                style={{
                                  backgroundColor: isSelected
                                    ? `${config.color}22`
                                    : diffUnlocked
                                      ? 'rgba(255,255,255,0.04)'
                                      : 'rgba(0,0,0,0.3)',
                                  borderWidth: '1.5px',
                                  borderStyle: 'solid',
                                  borderColor: isSelected
                                    ? config.color
                                    : diffUnlocked
                                      ? `${config.color}40`
                                      : 'rgba(255,255,255,0.05)',
                                  boxShadow: isSelected ? `0 0 16px ${config.color}30` : 'none',
                                  cursor: diffUnlocked ? 'pointer' : 'not-allowed',
                                  opacity: diffUnlocked ? 1 : 0.4,
                                }}
                              >
                                {!diffUnlocked && (
                                  <Lock size={10} className="mx-auto mb-1 text-gray-600" />
                                )}
                                <div
                                  className="font-black text-[11px] uppercase tracking-wide leading-tight"
                                  style={{ color: diffUnlocked ? config.color : '#444' }}
                                >
                                  {config.label}
                                </div>
                                <div className="flex items-center justify-center gap-0.5 mt-1">
                                  <Coins size={8} style={{ color: diffUnlocked ? '#fbbf24' : '#333' }} />
                                  <span
                                    className="text-[9px] font-bold"
                                    style={{ color: diffUnlocked ? '#fbbf24' : '#333' }}
                                  >
                                    x{config.coinMultiplier}
                                  </span>
                                </div>
                                {!diffUnlocked && (
                                  <p className="text-[8px] text-gray-700 mt-1 leading-tight">
                                    Beat {DIFFICULTY_CONFIGS[DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(diff) - 1]].label}
                                  </p>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {/* Coin hint */}
                        {selectedDifficulty && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[10px] text-yellow-500/70 text-center mt-2 font-medium"
                          >
                            x{DIFFICULTY_CONFIGS[selectedDifficulty].coinMultiplier} coin reward on this difficulty
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Play button */}
      <AnimatePresence>
        {canPlay && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 flex-shrink-0 px-5 pb-2"
          >
            <motion.button
              onClick={() => onSelect(selectedCourse!, selectedDifficulty!)}
              className="w-full rounded-2xl font-black text-base uppercase tracking-widest text-black"
              style={{ height: '60px', backgroundColor: '#fbbf24' }}
              whileHover={{ scale: 1.02, backgroundColor: '#f59e0b' }}
              whileTap={{ scale: 0.97 }}
            >
              PLAY {selectedCourse!.name} — {DIFFICULTY_CONFIGS[selectedDifficulty!].label} →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

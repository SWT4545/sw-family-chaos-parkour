'use client'
import { motion } from 'framer-motion'
import { RotateCcw, Home, ChevronRight, Clock, Medal } from 'lucide-react'
import type { Character } from '@/types/player'
import type { CourseDef, CourseDifficulty } from '@/types/game'
import { DIFFICULTY_CONFIGS } from '@/types/game'
import { CharacterImage } from '@/components/game/CharacterImage'
import { CHARACTER_ALIGNMENT } from '@/lib/game/assets/AssetRegistry'

function fmtTime(s: number): string {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface Props {
  player:               Character
  course:               CourseDef
  difficulty:           CourseDifficulty
  time:                 number
  coins:                number
  newCourseUnlocked:    boolean
  nextCourse:           CourseDef | null
  newDifficultyUnlocked: boolean
  badgeEarned?:         string
  onNextCourse:         () => void
  onReplayCourse:       () => void
  onBackToHub:          () => void
}

export function CourseVictoryScreen({
  player,
  course,
  difficulty,
  time,
  coins,
  newCourseUnlocked,
  nextCourse,
  newDifficultyUnlocked,
  badgeEarned,
  onNextCourse,
  onReplayCourse,
  onBackToHub,
}: Props) {
  const diffConfig   = DIFFICULTY_CONFIGS[difficulty]
  const finalCoins   = Math.round(coins * diffConfig.coinMultiplier)

  return (
    <div
      className="relative h-dvh overflow-hidden flex flex-col"
      style={{ backgroundColor: '#020208' }}
    >
      {/* Ambient character glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 55%, ${player.color}18 0%, transparent 68%)`,
        }}
      />

      {/* Blurred poster bg */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(28px)', transform: 'scale(1.08)',
        }}
      />

      <div
        className="relative z-10 flex flex-col h-full"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* ── Heading ── */}
        <motion.div
          className="flex-shrink-0 text-center pt-5 pb-2 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Course Complete!
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="font-bold text-sm text-gray-400 uppercase tracking-wider">
              {course.name}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: `${diffConfig.color}22`,
                color: diffConfig.color,
                border: `1px solid ${diffConfig.color}55`,
              }}
            >
              {diffConfig.label}
            </span>
          </div>
        </motion.div>

        {/* ── Unlock notifications ── */}
        <div className="flex-shrink-0 px-4 space-y-2">
          {newCourseUnlocked && nextCourse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="rounded-xl px-4 py-2.5 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
              }}
            >
              <span className="text-base">🔓</span>
              <span className="text-sm font-bold text-green-400">
                New Course Unlocked: {nextCourse.name}
              </span>
            </motion.div>
          )}

          {newDifficultyUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.65 }}
              className="rounded-xl px-4 py-2.5 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.25)',
              }}
            >
              <span className="text-base">🔓</span>
              <span className="text-sm font-bold text-yellow-400">
                {DIFFICULTY_CONFIGS[
                  (['easy','medium','hard','master'] as CourseDifficulty[])
                    [(['easy','medium','hard','master'] as CourseDifficulty[]).indexOf(difficulty) + 1]
                ]?.label ?? ''} mode unlocked on {course.name}
              </span>
            </motion.div>
          )}

          {badgeEarned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="rounded-xl px-4 py-2.5 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <span className="text-base">🏅</span>
              <span className="text-sm font-bold text-red-400">
                Badge Earned: Master Runner
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Character card ── */}
        <motion.div
          className="flex-1 flex items-end justify-center px-4 min-h-0"
          initial={{ opacity: 0, scale: 0.88, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              width:       'min(72vw, 260px)',
              aspectRatio: '2 / 3',
              border:      `2px solid ${player.color}45`,
              boxShadow:   `0 0 50px ${player.color}25, 0 0 100px ${player.color}10`,
            }}
          >
            <CharacterImage
              src={player.assets.victory}
              alt={`${player.name} victory`}
              {...CHARACTER_ALIGNMENT[player.id]}
              sizes="(max-width: 640px) 72vw, 260px"
              priority
            />
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          className="flex-shrink-0 px-4 pt-3 pb-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.75 }}
        >
          <div
            className="rounded-2xl grid grid-cols-3 overflow-hidden"
            style={{
              border:          '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            {[
              { label: 'TIME',  value: fmtTime(time),    icon: <Clock size={10} /> },
              { label: 'COINS', value: `💰 ${finalCoins}`, icon: null },
              { label: 'MULT',  value: `x${diffConfig.coinMultiplier}`, icon: <Medal size={10} /> },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 px-2"
                style={{
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-center gap-1 text-gray-600 mb-1.5">
                  {s.icon}
                  <span className="text-[9px] uppercase tracking-widest font-bold">{s.label}</span>
                </div>
                <span className="text-white font-black text-base tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Buttons ── */}
        <motion.div
          className="flex-shrink-0 px-4 space-y-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          {nextCourse && (
            <motion.button
              onClick={onNextCourse}
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest text-black"
              style={{ height: '56px', backgroundColor: '#fbbf24' }}
              whileHover={{ scale: 1.02, backgroundColor: '#f59e0b' }}
              whileTap={{ scale: 0.97 }}
            >
              Next Course: {nextCourse.name}
              <ChevronRight size={18} />
            </motion.button>
          )}

          <div className="flex gap-3">
            <button
              onClick={onBackToHub}
              className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15 hover:bg-white/8 transition-colors"
              style={{ height: '52px', paddingInline: '18px' }}
            >
              <Home size={14} />
              Hub
            </button>
            <motion.button
              onClick={onReplayCourse}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15 hover:bg-white/8 transition-colors"
              style={{ height: '52px' }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={14} />
              Replay
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

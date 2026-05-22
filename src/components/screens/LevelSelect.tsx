'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock, CheckCircle2, Trophy } from 'lucide-react'
import type { LevelDef } from '@/types/game'
import { ALL_LEVELS } from '@/lib/game/maps/levelRegistry'

const COMPLETED_KEY = 'swfcp_completed_levels'

const DIFFICULTY_COLORS: Record<string, string> = {
  'easy':    '#10b981',
  'easy+':   '#22d3ee',
  'medium':  '#f59e0b',
  'medium+': '#f97316',
  'hard':    '#ef4444',
  'expert':  '#a855f7',
  'chaos':   '#ec4899',
}

interface Props {
  onSelect: (level: LevelDef) => void
  onBack: () => void
  playerNumber?: 1 | 2
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLORS[difficulty] ?? '#888'
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {difficulty}
    </span>
  )
}

export function LevelSelect({ onSelect, onBack, playerNumber }: Props) {
  const [completed, setCompleted] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_KEY)
      if (raw) setCompleted(JSON.parse(raw) as string[])
    } catch {}
  }, [])

  function isUnlocked(level: LevelDef): boolean {
    if (level.difficultyNum === 1) return true
    const prev = ALL_LEVELS.find(l => l.difficultyNum === level.difficultyNum - 1)
    return prev ? completed.includes(prev.id) : false
  }

  return (
    <div className="relative min-h-dvh bg-[#06060e] flex flex-col overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pink-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[160px]" />
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
            Select Level
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {completed.length} / {ALL_LEVELS.length} completed
          </p>
        </div>

        <div className="w-20" />
      </div>

      {/* Level grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ALL_LEVELS.map((level, idx) => {
            const unlocked = isUnlocked(level)
            const done = completed.includes(level.id)
            const diffColor = DIFFICULTY_COLORS[level.difficulty] ?? '#888'
            const isHovered = hoveredId === level.id

            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06, ease: 'easeOut' }}
                onClick={() => unlocked && onSelect(level)}
                onMouseEnter={() => setHoveredId(level.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={!unlocked}
                className="relative text-left rounded-2xl p-4 border transition-all duration-200 overflow-hidden"
                style={{
                  backgroundColor: unlocked
                    ? isHovered
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.4)',
                  borderColor: done
                    ? `${diffColor}55`
                    : unlocked
                      ? isHovered ? `${diffColor}44` : 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.05)',
                  boxShadow: done
                    ? `0 0 24px ${diffColor}22, inset 0 0 24px ${diffColor}08`
                    : isHovered && unlocked
                      ? `0 0 20px ${diffColor}18`
                      : 'none',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
              >
                {/* Glow overlay for completed */}
                {done && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(ellipse at top left, ${diffColor}12 0%, transparent 70%)`,
                    }}
                  />
                )}

                {/* Lock overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-1">
                      <Lock size={22} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
                        Locked
                      </span>
                    </div>
                  </div>
                )}

                {/* Level number */}
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: unlocked ? diffColor : '#444' }}
                  >
                    LVL {level.difficultyNum}
                  </span>
                  {done ? (
                    <CheckCircle2 size={16} style={{ color: diffColor }} />
                  ) : unlocked ? (
                    <Trophy size={14} className="text-gray-600" />
                  ) : null}
                </div>

                {/* Name & subtitle */}
                <h3
                  className="font-black text-sm uppercase leading-tight mb-0.5"
                  style={{ color: unlocked ? '#fff' : '#333' }}
                >
                  {level.name}
                </h3>
                <p
                  className="text-[10px] font-semibold mb-2"
                  style={{ color: unlocked ? '#888' : '#333' }}
                >
                  {level.subtitle}
                </p>

                {/* Description */}
                <p
                  className="text-[10px] leading-relaxed mb-3"
                  style={{ color: unlocked ? '#666' : '#2a2a2a' }}
                >
                  {level.description}
                </p>

                {/* Difficulty badge */}
                <div className="flex items-center justify-between">
                  <DifficultyBadge difficulty={level.difficulty} />
                  {done && (
                    <span className="text-[10px] font-bold" style={{ color: diffColor }}>
                      Complete
                    </span>
                  )}
                  {!done && unlocked && (
                    <span className="text-[10px] text-gray-600 font-medium">
                      Play →
                    </span>
                  )}
                </div>

                {/* Unlock reward hint */}
                {!done && unlocked && (
                  <p className="text-[9px] text-gray-700 mt-2 font-medium truncate">
                    Reward: {level.unlockReward}
                  </p>
                )}
                {done && (
                  <p className="text-[9px] font-semibold mt-2 truncate" style={{ color: `${diffColor}99` }}>
                    Unlocked: {level.unlockReward}
                  </p>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

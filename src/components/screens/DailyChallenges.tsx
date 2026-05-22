'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { DAILY_CHALLENGES, DailyChallenges } from '@/lib/profiles/DailyChallenges'

interface Props {
  open:    boolean
  onClose: () => void
}

export function DailyChallengesPanel({ open, onClose }: Props) {
  const progress = DailyChallenges.getProgress()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="dc-bg"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="dc-panel"
            className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto
                       rounded-2xl border border-white/10 bg-[#0d0d14] px-6 py-5"
            initial={{ opacity: 0, scale: 0.94, y: '-48%' }}
            animate={{ opacity: 1, scale: 1,    y: '-50%' }}
            exit={{   opacity: 0, scale: 0.94,  y: '-48%' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-white text-base uppercase tracking-widest">Daily Challenges</h2>
                <p className="text-[10px] text-gray-600 mt-0.5">Resets every day</p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {DAILY_CHALLENGES.map((ch) => {
                const current = progress[ch.id] ?? 0
                const done    = current >= ch.goal
                const pct     = Math.min(1, current / ch.goal)

                return (
                  <div
                    key={ch.id}
                    className={`rounded-xl p-3 border transition-all ${
                      done ? 'border-yellow-500/30 bg-yellow-500/8' : 'border-white/8 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{ch.icon}</span>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wide ${done ? 'text-yellow-400' : 'text-white'}`}>
                            {ch.title}
                          </p>
                          <p className="text-[10px] text-gray-500 leading-tight">{ch.description}</p>
                        </div>
                      </div>
                      {done ? (
                        <span className="flex-shrink-0 text-[10px] font-bold text-yellow-400 border border-yellow-400/30 rounded-lg px-2 py-0.5 uppercase tracking-wider">
                          Done ✓
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] font-bold text-gray-500 border border-white/10 rounded-lg px-2 py-0.5 uppercase tracking-wider">
                          +{ch.reward}💰
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: done ? '#fbbf24' : '#4b5563' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1 text-right">
                      {current} / {ch.goal}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

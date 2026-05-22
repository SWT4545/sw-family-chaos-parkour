'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Trophy } from 'lucide-react'
import { SeasonService, CURRENT_SEASON, SEASON_REWARDS } from '@/lib/season/SeasonService'
import type { SeasonProfile } from '@/types/season'

interface Props {
  open:    boolean
  onClose: () => void
}

export function SeasonPanel({ open, onClose }: Props) {
  const [profile, setProfile] = useState<SeasonProfile | null>(null)

  useEffect(() => {
    if (open) setProfile(SeasonService.get())
  }, [open])

  if (!profile) return null

  const progress = SeasonService.levelProgress(profile)
  const xpToNext = SeasonService.xpToNextLevel(profile)
  const isMaxed  = profile.seasonLevel >= CURRENT_SEASON.levels

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="season-bg"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="season-panel"
            className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto rounded-2xl border border-white/10 bg-[#0a0a10] px-5 py-5 max-h-[80dvh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.94, y: '-48%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.94, y: '-48%' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Star size={12} className="text-yellow-400" />
                  <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Season Pass</p>
                </div>
                <h2 className="font-black text-white text-sm uppercase tracking-wide">{CURRENT_SEASON.name}</h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Level + XP bar */}
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Season Level</p>
                  <p className="font-black text-white text-3xl leading-none">{profile.seasonLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">XP Total</p>
                  <p className="font-black text-yellow-400 text-xl">{profile.seasonXP.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[9px] text-gray-600 mt-1">
                {isMaxed ? 'MAX LEVEL REACHED' : `${xpToNext} XP to next level`}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Matches', value: profile.matchesPlayed },
                { label: 'Wins',    value: profile.wins },
                { label: 'Coins',   value: profile.coinsEarned },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5 text-center">
                  <p className="font-black text-white text-lg leading-none">{stat.value}</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Rewards track */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">Rewards</p>
              <div className="flex flex-col gap-2">
                {SEASON_REWARDS.map(reward => {
                  const claimed = profile.claimedLevelRewards.includes(reward.level)
                  const unlocked = profile.seasonLevel >= reward.level
                  return (
                    <div
                      key={reward.level}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                        claimed ? 'border-yellow-500/30 bg-yellow-500/8' : unlocked ? 'border-green-500/20 bg-green-500/5' : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        claimed ? 'bg-yellow-400 text-black' : unlocked ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-600'
                      }`}>
                        {claimed ? '✓' : reward.level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${claimed ? 'text-yellow-400' : unlocked ? 'text-white' : 'text-gray-600'}`}>
                          {reward.label}
                        </p>
                        <p className="text-[9px] text-gray-600">Level {reward.level}</p>
                      </div>
                      {claimed && <span className="text-[10px] text-yellow-400 font-bold">Claimed</span>}
                      {!claimed && unlocked && <span className="text-[10px] text-green-400 font-bold">Unlocked!</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

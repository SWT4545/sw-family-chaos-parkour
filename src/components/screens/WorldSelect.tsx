'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Lock, CheckCircle2, Zap, Star } from 'lucide-react'
import { WORLD_REGISTRY } from '@/lib/game/levels/WorldRegistry'
import type { WorldDef, WorldLevelDef } from '@/lib/game/levels/LevelTypes'
import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import type { PlayerProfile } from '@/lib/game/profile/ProfileTypes'

interface Props {
  onSelectLevel: (world: WorldDef, level: WorldLevelDef) => void
  onBack: () => void
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

export function WorldSelect({ onSelectLevel, onBack }: Props) {
  const [profile,       setProfile]       = useState<PlayerProfile | null>(null)
  const [activeWorld,   setActiveWorld]   = useState<WorldDef>(WORLD_REGISTRY[0])
  const [hoveredLevel,  setHoveredLevel]  = useState<string | null>(null)

  useEffect(() => {
    setProfile(PlayerProfileService.getCurrent())
  }, [])

  const isWorldUnlocked = (world: WorldDef) =>
    profile?.unlockedWorlds.includes(world.id) ?? world.id === 'world1'

  const isLevelUnlocked = (world: WorldDef, level: WorldLevelDef) => {
    if (!isWorldUnlocked(world)) return false
    if (level.levelNumber === 1) return true
    // Check explicit unlock list first (set when previous level is completed)
    if (profile?.unlockedLevels?.includes(level.id)) return true
    // Fall back to previous-level-completed chain
    const prev = world.levels.find(l => l.levelNumber === level.levelNumber - 1)
    if (!prev) return true
    return profile?.completedLevels.includes(prev.id) ?? false
  }

  const isLevelComplete = (level: WorldLevelDef) =>
    profile?.completedLevels.includes(level.id) ?? false

  const bestTime = (level: WorldLevelDef) =>
    profile?.bestTimesByCourse[level.id] ?? null

  const worldProgress = (world: WorldDef) => {
    const total     = world.levels.length
    const completed = world.levels.filter(l => isLevelComplete(l)).length
    return { total, completed }
  }

  return (
    <div className="relative h-dvh bg-[#050508] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: [
          `radial-gradient(ellipse 80% 60% at 50% 20%, ${activeWorld.color}18 0%, transparent 70%)`,
          `radial-gradient(ellipse 80% 60% at 50% 20%, ${activeWorld.color}28 0%, transparent 70%)`,
          `radial-gradient(ellipse 80% 60% at 50% 20%, ${activeWorld.color}18 0%, transparent 70%)`,
        ]}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold" style={{ color: activeWorld.color }}>
            S&W Family Chaos Parkour
          </p>
          <h1 className="text-base sm:text-xl font-black uppercase tracking-widest text-white leading-tight mt-0.5">
            Select World
          </h1>
        </div>
        <div className="w-16">
          {profile && (
            <div className="text-right">
              <p className="text-[10px] text-yellow-400 font-bold">💰 {profile.coins.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Lv {profile.level}</p>
            </div>
          )}
        </div>
      </div>

      {/* World tabs */}
      <div className="relative z-10 flex-shrink-0 flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {WORLD_REGISTRY.map((world) => {
          const unlocked = isWorldUnlocked(world)
          const prog     = worldProgress(world)
          const active   = activeWorld.id === world.id
          return (
            <motion.button
              key={world.id}
              onClick={() => unlocked && setActiveWorld(world)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition-all"
              style={{
                borderColor: active ? world.color : 'rgba(255,255,255,0.08)',
                background:  active ? `${world.color}18` : 'rgba(255,255,255,0.03)',
                opacity:     unlocked ? 1 : 0.45,
                cursor:      unlocked ? 'pointer' : 'not-allowed',
              }}
              whileHover={unlocked ? { scale: 1.04 } : {}}
              whileTap={unlocked ? { scale: 0.97 } : {}}
            >
              <span className="text-xl">{world.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                {world.name}
              </span>
              {unlocked ? (
                <span className="text-[8px] text-gray-500">{prog.completed}/{prog.total}</span>
              ) : (
                <Lock size={8} className="text-gray-600" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Active world info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeWorld.id}
          className="relative z-10 flex-shrink-0 px-4 pb-3"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-2xl border px-4 py-3"
            style={{ borderColor: `${activeWorld.color}30`, background: `${activeWorld.color}0c` }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeWorld.icon}</span>
              <div>
                <h2 className="text-sm font-black uppercase text-white tracking-wide leading-none">
                  {activeWorld.name}
                </h2>
                <p className="text-[10px] mt-0.5" style={{ color: `${activeWorld.color}cc` }}>
                  {activeWorld.subtitle}
                </p>
              </div>
              <div className="ml-auto text-right">
                {(() => {
                  const p = worldProgress(activeWorld)
                  return (
                    <>
                      <p className="text-xs font-black" style={{ color: activeWorld.color }}>
                        {p.completed}/{p.total}
                      </p>
                      <p className="text-[9px] text-gray-500">levels</p>
                    </>
                  )
                })()}
              </div>
            </div>
            <p className="text-gray-400 text-[11px] mt-2 leading-snug">{activeWorld.description}</p>

            {/* Mechanics */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeWorld.mechanics.slice(0, 4).map(m => (
                <span key={m} className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                  style={{ backgroundColor: `${activeWorld.color}20`, color: `${activeWorld.color}cc` }}>
                  {m.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Level list */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeWorld.id + '-levels'}
            className="flex flex-col gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeWorld.levels.map((level, i) => {
              const unlocked  = isLevelUnlocked(activeWorld, level)
              const completed = isLevelComplete(level)
              const best      = bestTime(level)
              const hovered   = hoveredLevel === level.id
              const worldUnlocked = isWorldUnlocked(activeWorld)

              return (
                <motion.button
                  key={level.id}
                  onClick={() => unlocked && !level.comingSoon && onSelectLevel(activeWorld, level)}
                  onMouseEnter={() => setHoveredLevel(level.id)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  className="relative w-full text-left rounded-2xl border transition-all overflow-hidden"
                  style={{
                    borderColor: completed
                      ? `${activeWorld.color}60`
                      : hovered && unlocked
                        ? `${activeWorld.color}40`
                        : 'rgba(255,255,255,0.07)',
                    background: completed
                      ? `${activeWorld.color}14`
                      : hovered && unlocked
                        ? `${activeWorld.color}0c`
                        : 'rgba(255,255,255,0.03)',
                    opacity: unlocked ? 1 : 0.45,
                    cursor:  unlocked && !level.comingSoon ? 'pointer' : 'not-allowed',
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: unlocked ? 1 : 0.45, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={unlocked && !level.comingSoon ? { scale: 1.01 } : {}}
                  whileTap={unlocked && !level.comingSoon ? { scale: 0.99 } : {}}
                >
                  {/* Boss level accent strip */}
                  {level.isBoss && (
                    <div className="absolute top-0 inset-x-0 h-0.5 rounded-t"
                      style={{ background: `linear-gradient(to right, transparent, ${activeWorld.color}, transparent)` }} />
                  )}

                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Level number badge */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{
                        background: completed ? activeWorld.color : `${activeWorld.color}20`,
                        color:      completed ? '#000' : activeWorld.color,
                      }}>
                      {level.isBoss ? '⚡' : level.levelNumber}
                    </div>

                    {/* Title + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-white uppercase tracking-wide leading-none">
                          {level.title}
                        </p>
                        {level.isBoss && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                            style={{ background: `${activeWorld.color}30`, color: activeWorld.color }}>
                            BOSS
                          </span>
                        )}
                        {level.comingSoon && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-gray-800 text-gray-500">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{level.subtitle}</p>
                      {best && (
                        <p className="text-[10px] mt-0.5" style={{ color: `${activeWorld.color}bb` }}>
                          Best: {fmtTime(best)}
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {!worldUnlocked ? (
                        <Lock size={16} className="text-gray-600" />
                      ) : !unlocked ? (
                        <Lock size={14} className="text-gray-600" />
                      ) : completed ? (
                        <CheckCircle2 size={18} style={{ color: activeWorld.color }} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: `${activeWorld.color}50` }} />
                      )}
                      <p className="text-[9px] text-yellow-500 font-bold">
                        +{level.completionReward.coins}
                      </p>
                    </div>
                  </div>

                  {/* Completion reward preview on hover */}
                  {hovered && unlocked && !level.comingSoon && level.completionReward.unlocks && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="px-4 pb-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap size={10} style={{ color: activeWorld.color }} />
                        <span className="text-[10px] text-gray-400">
                          Unlocks: {level.completionReward.unlocks.map(u =>
                            u.startsWith('world') ? `World ${u.slice(-1)}` : u.charAt(0).toUpperCase() + u.slice(1)
                          ).join(', ')}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

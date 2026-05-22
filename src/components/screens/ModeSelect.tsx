'use client'
import { motion } from 'framer-motion'
import { ChevronLeft, User, Users, Wifi } from 'lucide-react'
import type { GameMode } from '@/types/player'

interface Props {
  onSelect: (mode: GameMode) => void
  onBack:   () => void
}

const modes = [
  {
    id:       'solo' as GameMode,
    icon:     <User size={28} />,
    label:    'Solo Run',
    sub:      'Race alone against the clock',
    color:    '#fbbf24',
    enabled:  true,
  },
  {
    id:       '1v1' as GameMode,
    icon:     <Users size={28} />,
    label:    'Local 1v1',
    sub:      'Two players · same device',
    color:    '#06b6d4',
    enabled:  true,
  },
  {
    id:       'online' as GameMode,
    icon:     <Wifi size={28} />,
    label:    'Online Family Lobby',
    sub:      'Play with family anywhere',
    color:    '#8b5cf6',
    enabled:  true,
  },
]

export function ModeSelect({ onSelect, onBack }: Props) {
  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      {/* Blurred bg */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'url(/family-chaos-poster.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(20px)', transform: 'scale(1.05)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold">
            S&W Family Chaos Parkour
          </p>
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">
            Select Mode
          </h1>
        </div>
        <div className="w-16" />
      </div>

      {/* Mode cards */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-6">
        {modes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="w-full max-w-sm"
          >
            <button
              onClick={() => m.enabled && onSelect(m.id)}
              disabled={!m.enabled}
              className="w-full relative rounded-2xl border p-5 text-left transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed
                         enabled:hover:border-opacity-60 enabled:hover:scale-[1.02]"
              style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                borderColor: `${m.color}35`,
              }}
            >
              {/* Coming soon badge */}
              {!m.enabled && (
                <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {'badge' in m ? (m as { badge: string }).badge : 'Coming Soon'}
                </span>
              )}

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${m.color}18`, color: m.color, border: `1.5px solid ${m.color}40` }}
                >
                  {m.icon}
                </div>
                <div>
                  <h2 className="font-black text-white text-lg uppercase tracking-wider leading-tight">
                    {m.label}
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">{m.sub}</p>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

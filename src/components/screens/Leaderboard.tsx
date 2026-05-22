'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Trophy, Clock, Coins } from 'lucide-react'
import { LocalProfiles } from '@/lib/profiles/LocalProfiles'

type Tab = 'solo-times' | 'most-wins' | 'most-coins'

interface Props {
  onBack: () => void
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const CHAR_COLORS: Record<string, string> = {
  commander: '#dc2626', bj: '#e11d48', brae: '#8b5cf6', xanny: '#06b6d4',
}

export function Leaderboard({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('solo-times')
  const profiles = LocalProfiles.getAll()

  const rows = (() => {
    switch (tab) {
      case 'solo-times':
        return [...profiles]
          .filter((p) => p.bestSoloTime !== null)
          .sort((a, b) => (a.bestSoloTime ?? Infinity) - (b.bestSoloTime ?? Infinity))
          .map((p, i) => ({ rank: i + 1, name: p.playerName, charId: p.selectedCharacterId, value: fmtTime(p.bestSoloTime!), raw: p.bestSoloTime! }))
      case 'most-wins':
        return [...profiles]
          .sort((a, b) => b.wins - a.wins)
          .map((p, i) => ({ rank: i + 1, name: p.playerName, charId: p.selectedCharacterId, value: `${p.wins} W`, raw: p.wins }))
      case 'most-coins':
        return [...profiles]
          .sort((a, b) => b.totalCoins - a.totalCoins)
          .map((p, i) => ({ rank: i + 1, name: p.playerName, charId: p.selectedCharacterId, value: `💰 ${p.totalCoins}`, raw: p.totalCoins }))
    }
  })()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'solo-times', label: 'Solo Times',  icon: <Clock  size={12} /> },
    { id: 'most-wins',  label: 'Most Wins',   icon: <Trophy size={12} /> },
    { id: 'most-coins', label: 'Most Coins',  icon: <span className="text-[10px]">💰</span> },
  ]

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px)', transform: 'scale(1.05)' }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold">S&W Family</p>
          <h1 className="text-lg font-black uppercase tracking-widest text-white leading-tight">Leaderboard</h1>
        </div>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex-shrink-0 flex gap-2 px-5 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              tab === t.id
                ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400'
                : 'bg-white/[0.03] border-white/8 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-600 text-sm">No data yet — play some matches!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {rows.map((row, i) => (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3 border border-white/8 bg-white/[0.03]"
              >
                <span className={`text-lg font-black w-6 text-center ${row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-gray-400' : row.rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm uppercase truncate">{row.name}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold truncate" style={{ color: CHAR_COLORS[row.charId] ?? '#888' }}>
                    {row.charId}
                  </p>
                </div>
                <p className="font-black text-white text-sm tabular-nums flex-shrink-0">{row.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

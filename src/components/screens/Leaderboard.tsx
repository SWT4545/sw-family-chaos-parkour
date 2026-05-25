'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Trophy, Clock, RefreshCw, Star, Coins } from 'lucide-react'
import { fetchLeaderboard } from '@/lib/game/leaderboard/LeaderboardService'
import type { LeaderboardCategory, LeaderboardEntry } from '@/lib/game/leaderboard/LeaderboardTypes'

type Tab = 'wins' | 'coins' | 'solo-time'

interface Props { onBack: () => void }

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

function fmtTime(score: number, category: LeaderboardCategory): string {
  if (category === 'solo-time') return score > 1000 ? fmtMs(score) : `${Math.floor(score)}s`
  if (category === 'coins')     return `💰 ${score.toLocaleString()}`
  return `${score} W`
}

const CHAR_COLORS: Record<string, string> = {
  commander: '#dc2626', bj: '#e11d48', brae: '#8b5cf6', xanny: '#06b6d4',
  zaya: '#ec4899', governor: '#22c55e',
}

const TABS: { id: Tab; label: string; category: LeaderboardCategory; color: string }[] = [
  { id: 'wins',      label: 'Most Wins',   category: 'wins',      color: '#fbbf24' },
  { id: 'coins',     label: 'Top Coins',   category: 'coins',     color: '#22c55e' },
  { id: 'solo-time', label: 'Best Times',  category: 'solo-time', color: '#60a5fa' },
]

export function Leaderboard({ onBack }: Props) {
  const [tab,     setTab]     = useState<Tab>('wins')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState<'firebase' | 'local'>('firebase')

  const activeTab = TABS.find(t => t.id === tab)!

  const fetchData = (t: Tab) => {
    setLoading(true)
    const category = TABS.find(x => x.id === t)!.category
    fetchLeaderboard(category, 20).then(page => {
      setEntries(page.entries)
      setSource(page.source)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData(tab) }, [tab])

  return (
    <div
      className="relative h-dvh bg-[#060608] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      {/* Ambient bg */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px)', transform: 'scale(1.05)' }} />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: [
          `radial-gradient(ellipse 60% 40% at 50% 0%, ${activeTab.color}10 0%, transparent 70%)`,
          `radial-gradient(ellipse 60% 40% at 50% 0%, ${activeTab.color}20 0%, transparent 70%)`,
          `radial-gradient(ellipse 60% 40% at 50% 0%, ${activeTab.color}10 0%, transparent 70%)`,
        ]}}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] font-bold" style={{ color: activeTab.color }}>
            S&W Family
          </p>
          <h1 className="text-lg font-black uppercase tracking-widest text-white leading-tight">Leaderboard</h1>
        </div>
        <button onClick={() => fetchData(tab)} className="text-gray-500 hover:text-white transition-colors p-1">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex-shrink-0 flex gap-2 px-5 pb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all"
            style={{
              backgroundColor: tab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.03)',
              borderColor:     tab === t.id ? `${t.color}50` : 'rgba(255,255,255,0.08)',
              color:           tab === t.id ? t.color         : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${activeTab.color}40`, borderTopColor: activeTab.color }} />
            <p className="text-gray-600 text-xs uppercase tracking-widest">Loading…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <span className="text-5xl opacity-30">🏆</span>
            <div>
              <p className="text-white font-black uppercase tracking-wide">No Data Yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first on the board.</p>
              <p className="text-gray-600 text-xs mt-1">Complete a level to get on the leaderboard.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {source === 'local' && (
              <p className="text-[9px] text-gray-600 uppercase tracking-widest text-center pb-2">
                Showing your local stats · Syncs to global after each match
              </p>
            )}
            {entries.map((entry, i) => {
              const rank  = i + 1
              const color = CHAR_COLORS[entry.characterId] ?? '#888'
              return (
                <motion.div
                  key={`${entry.entryId ?? entry.playerId}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                  style={{
                    borderColor: rank <= 3 ? `${activeTab.color}30` : 'rgba(255,255,255,0.06)',
                    background:  rank <= 3 ? `${activeTab.color}08` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span className="text-lg font-black w-7 text-center flex-shrink-0">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
                      <span className="text-sm text-gray-600">{rank}</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm uppercase truncate leading-none">
                      {entry.displayName ?? 'Unknown'}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-bold mt-0.5 truncate" style={{ color }}>
                      {entry.characterId}
                      {entry.courseId && <span className="text-gray-600 ml-1">· {entry.courseId}</span>}
                    </p>
                  </div>
                  <p className="font-black text-sm tabular-nums flex-shrink-0" style={{ color: activeTab.color }}>
                    {fmtTime(entry.score, entry.category)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

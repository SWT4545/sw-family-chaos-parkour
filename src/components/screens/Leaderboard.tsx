'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Trophy, Clock, RefreshCw } from 'lucide-react'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/firebase/leaderboards'
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
  zaya: '#ec4899', governor: '#22c55e',
}

const TAB_CATEGORY: Record<Tab, LeaderboardEntry['category']> = {
  'solo-times': 'solo-time',
  'most-wins':  'wins',
  'most-coins': 'coins',
}

// Build rows from local profiles as a fallback
function localRows(tab: Tab) {
  const profiles = LocalProfiles.getAll()
  switch (tab) {
    case 'solo-times':
      return profiles
        .filter((p) => p.bestSoloTime !== null)
        .sort((a, b) => (a.bestSoloTime ?? Infinity) - (b.bestSoloTime ?? Infinity))
        .map((p) => ({ playerId: p.selectedCharacterId, playerName: p.playerName, characterId: p.selectedCharacterId, score: p.bestSoloTime!, category: 'solo-time' as const, updatedAt: p.lastUpdated }))
    case 'most-wins':
      return profiles
        .filter((p) => p.wins > 0)
        .sort((a, b) => b.wins - a.wins)
        .map((p) => ({ playerId: p.selectedCharacterId, playerName: p.playerName, characterId: p.selectedCharacterId, score: p.wins, category: 'wins' as const, updatedAt: p.lastUpdated }))
    case 'most-coins':
      return profiles
        .filter((p) => p.totalCoins > 0)
        .sort((a, b) => b.totalCoins - a.totalCoins)
        .map((p) => ({ playerId: p.selectedCharacterId, playerName: p.playerName, characterId: p.selectedCharacterId, score: p.totalCoins, category: 'coins' as const, updatedAt: p.lastUpdated }))
  }
}

function formatScore(entry: LeaderboardEntry): string {
  if (entry.category === 'solo-time') return fmtTime(entry.score)
  if (entry.category === 'coins')     return `💰 ${entry.score}`
  return `${entry.score} W`
}

export function Leaderboard({ onBack }: Props) {
  const [tab, setTab]         = useState<Tab>('most-wins')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource]   = useState<'firebase' | 'local'>('firebase')

  const fetchEntries = (t: Tab) => {
    setLoading(true)
    getLeaderboard(TAB_CATEGORY[t], 20).then((data) => {
      if (data.length > 0) {
        setEntries(data)
        setSource('firebase')
      } else {
        // Nothing in Firestore yet — show local stats
        setEntries(localRows(t))
        setSource('local')
      }
      setLoading(false)
    })
  }

  useEffect(() => { fetchEntries(tab) }, [tab])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'most-wins',  label: 'Most Wins',   icon: <Trophy size={12} /> },
    { id: 'most-coins', label: 'Most Coins',  icon: <span className="text-[10px]">💰</span> },
    { id: 'solo-times', label: 'Best Times',  icon: <Clock  size={12} /> },
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
        <button
          onClick={() => fetchEntries(tab)}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-6 h-6 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-gray-600 text-xs uppercase tracking-widest">Loading…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-600 text-sm">No data yet — play some matches!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            {source === 'local' && (
              <p className="text-[9px] text-gray-600 uppercase tracking-widest text-center pb-1">
                Local data — global stats sync after each match
              </p>
            )}
            {entries.map((entry, i) => {
              const rank = i + 1
              return (
                <motion.div
                  key={entry.playerId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-xl px-4 py-3 border border-white/8 bg-white/[0.03]"
                >
                  <span className={`text-lg font-black w-6 text-center ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm uppercase truncate">{entry.playerName}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold truncate" style={{ color: CHAR_COLORS[entry.characterId] ?? '#888' }}>
                      {entry.characterId}
                    </p>
                  </div>
                  <p className="font-black text-white text-sm tabular-nums flex-shrink-0">{formatScore(entry)}</p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createRoom } from '@/lib/firebase/rooms'
import { isFirebaseConfigured } from '@/lib/firebase/firebaseConfig'
import type { Character } from '@/types/player'

interface Props {
  player:     Character
  playerName: string
  onCreated:  (code: string) => void
  onBack:     () => void
}

export function RoomCreator({ player, playerName, onCreated, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleCreate() {
    if (!isFirebaseConfigured()) {
      setError('Firebase not configured. Add .env.local keys to enable online play.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const code = await createRoom({
        hostId:      player.id,
        hostName:    playerName,
        characterId: player.id,
        mapId:       'rooftop',
      })
      if (code) onCreated(code)
      else setError('Failed to create room. Try again.')
    } catch (e) {
      setError('Connection error. Check your internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest text-white">Create Room</h1>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/[0.06] p-6 text-center"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-1">Playing as</p>
          <h2 className="font-black text-white text-2xl uppercase">{playerName}</h2>
          <p className="text-gray-500 text-xs mt-1" style={{ color: player.color }}>{player.name}</p>
        </div>

        {error && (
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <motion.button
          onClick={handleCreate}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-sm py-4 rounded-2xl font-black text-lg uppercase tracking-widest text-black bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={20} className="animate-spin" /> Creating...</> : '▶ Create Room'}
        </motion.button>
      </div>
    </div>
  )
}

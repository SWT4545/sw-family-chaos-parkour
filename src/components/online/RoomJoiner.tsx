'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { joinRoom } from '@/lib/firebase/rooms'
import { isFirebaseConfigured } from '@/lib/firebase/firebaseConfig'
import type { Character } from '@/types/player'

interface Props {
  player:     Character
  playerName: string
  onJoined:   (code: string) => void
  onBack:     () => void
}

export function RoomJoiner({ player, playerName, onJoined, onBack }: Props) {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 5) { setError('Room code must be 5 characters'); return }
    if (!isFirebaseConfigured()) {
      setError('Firebase not configured. Add .env.local keys to enable online play.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await joinRoom({
        code:        trimmed,
        playerId:    player.id,
        playerName,
        characterId: player.id,
      })
      if (result.success) onJoined(trimmed)
      else setError(result.error ?? 'Could not join room')
    } catch {
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
        <h1 className="text-lg font-black uppercase tracking-widest text-white">Join Room</h1>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/[0.06] p-6 text-center"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
        >
          <p className="text-gray-500 text-xs mb-4">Enter the 5-letter room code from your family</p>
          <input
            ref={inputRef}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="XXXXX"
            className="w-full text-center text-4xl font-black tracking-[0.5em] text-white bg-transparent border-b-2 border-gray-600 focus:border-yellow-400 focus:outline-none pb-2 transition-colors uppercase"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
          />
        </div>

        {error && (
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <motion.button
          onClick={handleJoin}
          disabled={loading || code.length !== 5}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-sm py-4 rounded-2xl font-black text-lg uppercase tracking-widest text-black bg-yellow-400 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={20} className="animate-spin" /> Joining...</> : '→ Join Room'}
        </motion.button>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, Music, Loader2, CheckCircle } from 'lucide-react'
import { uploadMusicTrack, fetchMusicRegistry, deleteMusicTrack } from '@/lib/firebase/storageService'
import { isFirebaseConfigured } from '@/lib/firebase/firebaseConfig'
import type { MusicTrack } from '@/lib/firebase/storageService'

const PRESET_SLOTS = [
  { id: 'main-theme',    name: 'Main Theme',    desc: 'Main menu + mode select',  loop: true },
  { id: 'lobby-theme',   name: 'Lobby Theme',   desc: 'Character select + lobby', loop: true },
  { id: 'race-theme',    name: 'Race Theme',    desc: 'In-game music',            loop: true },
  { id: 'victory-theme', name: 'Victory Theme', desc: 'Victory screen',           loop: false },
]

export function MusicUploader() {
  const [tracks,     setTracks]     = useState<MusicTrack[]>([])
  const [uploading,  setUploading]  = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const fileRefs    = useRef<Record<string, HTMLInputElement | null>>({})

  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (configured) fetchMusicRegistry().then(setTracks)
  }, [configured])

  async function handleUpload(slot: typeof PRESET_SLOTS[number], file: File) {
    if (!file.type.includes('audio')) { setError('Please select an MP3 file'); return }
    setUploading(slot.id)
    setError(null)
    const result = await uploadMusicTrack(file, slot.id, slot.name, slot.loop)
    setUploading(null)
    if (result) {
      setTracks(prev => [...prev.filter(t => t.id !== slot.id), result])
      setSuccess(slot.id)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Upload failed. Check Firebase Storage rules.')
    }
  }

  async function handleDelete(trackId: string) {
    setDeleting(trackId)
    await deleteMusicTrack(trackId)
    setTracks(prev => prev.filter(t => t.id !== trackId))
    setDeleting(null)
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-400 font-bold text-sm mb-1">Firebase Not Configured</p>
        <p className="text-gray-500 text-xs">Add Firebase environment variables to enable music upload.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {PRESET_SLOTS.map(slot => {
        const existing  = tracks.find(t => t.id === slot.id)
        const isLoading = uploading === slot.id || deleting === slot.id
        const isSuccess = success === slot.id

        return (
          <div
            key={slot.id}
            className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existing ? 'bg-green-500/20' : 'bg-white/5'}`}>
                  <Music size={14} className={existing ? 'text-green-400' : 'text-gray-600'} />
                </div>
                <div>
                  <p className="font-black text-white text-sm uppercase tracking-wider">{slot.name}</p>
                  <p className="text-[10px] text-gray-600">{slot.desc} · {slot.loop ? 'Looping' : 'One-shot'}</p>
                </div>
              </div>
              {isSuccess && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
            </div>

            {existing ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2">
                  <p className="text-green-400 text-xs font-bold truncate">✓ Uploaded</p>
                  <p className="text-gray-600 text-[10px]">{new Date(existing.uploadedAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => fileRefs.current[slot.id]?.click()}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  Replace
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  disabled={isLoading}
                  className="p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  {deleting === slot.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => fileRefs.current[slot.id]?.click()}
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-yellow-500/40 text-gray-500 hover:text-yellow-400 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
              >
                {isLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  : <><Upload size={14} /> Upload {slot.name} (.mp3)</>
                }
              </motion.button>
            )}

            <input
              ref={el => { fileRefs.current[slot.id] = el }}
              type="file"
              accept="audio/mpeg,audio/mp3,.mp3"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(slot, file)
                e.target.value = ''
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

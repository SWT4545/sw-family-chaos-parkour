'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, Music, Music2 } from 'lucide-react'
import { getAudioSettings, updateAudioSettings } from '@/lib/game/audio/AudioSettings'
import { MusicManager } from '@/lib/game/audio/MusicManager'

interface Props {
  open:    boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: Props) {
  const initial = getAudioSettings()
  const [musicMuted,  setMusicMuted]  = useState(initial.musicMuted)
  const [musicVolume, setMusicVolume] = useState(initial.musicVolume)
  const [sfxMuted,    setSfxMuted]    = useState(initial.sfxMuted)
  const [sfxVolume,   setSfxVolume]   = useState(initial.sfxVolume)

  function toggleMusic() {
    const next = !musicMuted
    setMusicMuted(next)
    MusicManager.setMuted(next)
  }

  function handleMusicVol(v: number) {
    setMusicVolume(v)
    MusicManager.setVolume(v)
  }

  function toggleSfx() {
    const next = !sfxMuted
    setSfxMuted(next)
    updateAudioSettings({ sfxMuted: next })
  }

  function handleSfxVol(v: number) {
    setSfxVolume(v)
    updateAudioSettings({ sfxVolume: v })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto
                       rounded-2xl border border-white/10 bg-[#0d0d14] px-6 py-5"
            initial={{ opacity: 0, scale: 0.94, y: '-48%' }}
            animate={{ opacity: 1, scale: 1,    y: '-50%' }}
            exit={{   opacity: 0, scale: 0.94,  y: '-48%' }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white text-base uppercase tracking-widest">Settings</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Music */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {musicMuted ? <Music2 size={14} className="text-gray-500" /> : <Music size={14} className="text-yellow-500" />}
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Music</span>
                </div>
                <button
                  onClick={toggleMusic}
                  className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-lg border transition-colors ${
                    musicMuted
                      ? 'border-gray-700 text-gray-500 bg-gray-800/50'
                      : 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                  }`}
                >
                  {musicMuted ? 'Off' : 'On'}
                </button>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={musicVolume}
                disabled={musicMuted}
                onChange={(e) => handleMusicVol(Number(e.target.value))}
                className="w-full accent-yellow-400 disabled:opacity-30"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/8 mb-5" />

            {/* SFX */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {sfxMuted ? <VolumeX size={14} className="text-gray-500" /> : <Volume2 size={14} className="text-cyan-400" />}
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-400">SFX</span>
                </div>
                <button
                  onClick={toggleSfx}
                  className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-lg border transition-colors ${
                    sfxMuted
                      ? 'border-gray-700 text-gray-500 bg-gray-800/50'
                      : 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
                  }`}
                >
                  {sfxMuted ? 'Off' : 'On'}
                </button>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={sfxVolume}
                disabled={sfxMuted}
                onChange={(e) => handleSfxVol(Number(e.target.value))}
                className="w-full accent-cyan-400 disabled:opacity-30"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

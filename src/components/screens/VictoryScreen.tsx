'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react'
import { Character } from '@/types/player'

function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const CELEB_IDS = new Set(['commander', 'bj', 'brae', 'xanny'])
function celebImg(id: string) {
  return CELEB_IDS.has(id)
    ? `/game-assets/characters-victory/${id}/${id}-celeb.png`
    : `/game-assets/characters-normalized/${id}/${id}-full.png`
}

interface Props {
  winner:        Character | null
  loser:         Character | null
  time:          number
  winnerCoins:   number
  loserCoins:    number
  onPlayAgain:   () => void
  onBackToLobby: () => void
}

interface Piece {
  id: number; x: number; delay: number; dur: number
  color: string; size: number; drift: number; rot: number
}

export function VictoryScreen({ winner, loser, time, winnerCoins, loserCoins, onPlayAgain, onBackToLobby }: Props) {
  const winColor = winner?.color ?? '#eab308'

  const confetti = useMemo<Piece[]>(() => {
    const palette = [winColor, '#fbbf24', '#ffffff', '#f97316', winColor + 'cc']
    return Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x:     Math.random() * 105 - 2,
      delay: Math.random() * 2.5,
      dur:   1.8 + Math.random() * 2.0,
      color: palette[i % palette.length],
      size:  5 + Math.random() * 9,
      drift: (Math.random() - 0.5) * 180,
      rot:   (Math.random() - 0.5) * 720,
    }))
  }, [winColor])

  const bursts = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({ id: i, delay: 0.05 + i * 0.18 }))
  , [])

  return (
    <div className="relative h-dvh overflow-hidden" style={{ backgroundColor: '#02020C' }}>

      {/* Deep color atmosphere */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ background: `radial-gradient(ellipse 100% 90% at 50% 65%, ${winColor}28 0%, ${winColor}0a 45%, transparent 70%)` }}
      />

      {/* Poster texture */}
      <div className="absolute inset-0 opacity-[0.10]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(32px)', transform: 'scale(1.1)' }} />

      {/* ── Burst rings ── */}
      {bursts.map(b => (
        <motion.div key={b.id}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ border: `2px solid ${winColor}`, width: 60, height: 60 }}
          initial={{ scale: 0.5, opacity: 0.7 }}
          animate={{ scale: 9, opacity: 0 }}
          transition={{ duration: 1.1, delay: b.delay, ease: 'easeOut' }}
        />
      ))}

      {/* ── Confetti rain ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {confetti.map(p => (
          <motion.div key={p.id}
            className="absolute"
            style={{ left: `${p.x}%`, top: -16, width: p.size, height: p.size * 0.45, backgroundColor: p.color, borderRadius: 2 }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: '108vh', x: p.drift, rotate: p.rot, opacity: [1, 1, 0.8, 0] }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'linear', repeat: Infinity, repeatDelay: Math.random() * 1.5 }}
          />
        ))}
      </div>

      {/* ── Character image — large, bottom-anchored ── */}
      {winner && (
        <motion.img
          key={winner.id}
          src={celebImg(winner.id)}
          alt={winner.name}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none z-20"
          style={{ maxHeight: '68vh', maxWidth: '100vw', width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'bottom center' }}
          initial={{ y: 60, opacity: 0, scale: 0.88 }}
          animate={{ y: 0,  opacity: 1, scale: 1   }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* ── Color ground glow under character ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-15"
        style={{ background: `linear-gradient(to top, ${winColor}22 0%, transparent 100%)` }} />

      {/* ── Top overlay: badge + name ── */}
      <div
        className="absolute top-0 inset-x-0 z-30 pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)' }}
      >
        {/* Trophy badge */}
        <motion.div className="flex justify-center mb-3"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ backgroundColor: '#fbbf2418', color: '#fbbf24', border: '1px solid #fbbf2445' }}>
            <Trophy size={10} /> Chaos Dominated
          </div>
        </motion.div>

        {/* Winner name */}
        <motion.div className="text-center px-4"
          initial={{ opacity: 0, scale: 0.6, y: -10 }}
          animate={{ opacity: 1, scale: 1,   y: 0   }}
          transition={{ duration: 0.5, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="font-black uppercase leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 7rem)',
              color: winColor,
              textShadow: `0 0 40px ${winColor}88, 0 0 80px ${winColor}44`,
            }}>
            {winner?.name ?? 'Draw'}
          </h1>
          <motion.p className="text-white/40 text-xs font-bold uppercase tracking-[0.35em] mt-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}>
            Wins the Chaos
          </motion.p>
        </motion.div>
      </div>

      {/* ── Bottom panel: stats + buttons ── */}
      <div className="absolute bottom-0 inset-x-0 z-30"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* Stats strip */}
        <motion.div className="mx-4 mb-3 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.75 }}>
          <div className="flex items-stretch">
            <div className="flex-1 flex flex-col items-center py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Time</span>
              <span className="text-white font-black text-lg tabular-nums">⏱ {fmtTime(time)}</span>
            </div>
            <div className="flex-1 flex flex-col items-center py-3" style={{ borderRight: loser ? '1px solid rgba(255,255,255,0.07)' : undefined }}>
              <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1">Coins</span>
              <span className="text-yellow-400 font-black text-lg">💰 {winnerCoins}</span>
            </div>
            {loser && (
              <div className="flex-1 flex flex-col items-center py-3">
                <span className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-1" style={{ color: loser.color + 'aa' }}>{loser.name}</span>
                <span className="font-bold text-sm" style={{ color: loser.color + '99' }}>💰 {loserCoins} · 🙃</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div className="flex gap-3 px-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.95 }}>
          <button onClick={onBackToLobby}
            className="flex items-center justify-center gap-2 rounded-2xl font-bold text-sm uppercase tracking-wider text-white border border-white/15"
            style={{ height: 56, paddingInline: 20 }}>
            <ArrowLeft size={14} /> Lobby
          </button>
          <motion.button onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-black text-base uppercase tracking-widest"
            style={{ height: 56, background: winColor, color: '#000' }}
            whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.97 }}>
            <RotateCcw size={16} /> Play Again
          </motion.button>
        </motion.div>
      </div>

    </div>
  )
}

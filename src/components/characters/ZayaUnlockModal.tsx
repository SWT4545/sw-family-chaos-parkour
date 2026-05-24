'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZayaUnlock } from '@/lib/game/characters/ZayaUnlock'

type Phase = 'enter' | 'idle' | 'wrong' | 'reveal' | 'done'

interface Props {
  onUnlocked: () => void
  onClose:    () => void
}

export function ZayaUnlockModal({ onUnlocked, onClose }: Props) {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('enter')
  const inputRef = useRef<HTMLInputElement>(null)

  const particles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,
    y:     Math.random() * 100,
    delay: Math.random() * 4,
    dur:   2 + Math.random() * 3,
    size:  2 + Math.random() * 5,
    drift: (Math.random() - 0.5) * 80,
    up:    40 + Math.random() * 80,
  })), [])

  const burst = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id:    i,
    angle: (i / 60) * 360,
    dist:  120 + Math.random() * 180,
    size:  4 + Math.random() * 8,
    color: ['#ec4899','#f472b6','#fbbf24','#ffffff','#a855f7'][i % 5],
  })), [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('idle')
      setTimeout(() => inputRef.current?.focus(), 200)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  function handleChange(val: string) {
    const trimmed = val.slice(0, 6)
    setInput(trimmed)
    if (phase === 'wrong') setPhase('idle')
    if (trimmed.toLowerCase() === 'zaya') {
      ZayaUnlock.unlock()
      setPhase('reveal')
      setTimeout(() => {
        setPhase('done')
        setTimeout(onUnlocked, 800)
      }, 3000)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && input.toLowerCase() !== 'zaya' && input.length > 0) {
      setPhase('wrong')
      setTimeout(() => setPhase('idle'), 700)
    }
    if (e.key === 'Escape' && phase !== 'reveal' && phase !== 'done') onClose()
  }

  const isRevealing = phase === 'reveal' || phase === 'done'
  const zayaColor   = '#ec4899'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Deep pink atmosphere — intensifies on reveal */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isRevealing ? 1 : 0.4 }}
        transition={{ duration: 0.6 }}
        style={{ background: `radial-gradient(ellipse 90% 80% at 50% 55%, ${zayaColor}35 0%, ${zayaColor}0a 50%, transparent 75%)` }}
      />

      {/* Floating sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: p.id % 3 === 0 ? '#fbbf24' : zayaColor }}
            animate={{ y: [-p.up, 0, -p.up], x: [0, p.drift, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Screen flash on reveal */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ background: zayaColor }}
          />
        )}
      </AnimatePresence>

      {/* Burst confetti on reveal */}
      <AnimatePresence>
        {isRevealing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {burst.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-sm"
                style={{ width: p.size, height: p.size * 0.45, backgroundColor: p.color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos(p.angle * Math.PI / 180) * p.dist,
                  y: Math.sin(p.angle * Math.PI / 180) * p.dist,
                  opacity: [1, 1, 0],
                  scale: [0, 1.5, 0.8],
                }}
                transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Close button — hidden during reveal */}
      {!isRevealing && (
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-600 hover:text-gray-400 text-2xl font-black z-30 transition-colors"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          ✕
        </button>
      )}

      {/* ── Character silhouette → full color ── */}
      <motion.div
        className="relative flex items-end justify-center"
        style={{ height: '42vh', zIndex: 5 }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src="/game-assets/characters-gameplay/zaya/zaya-full.png"
          alt="???"
          className="h-full w-auto object-contain select-none"
          animate={{
            filter: isRevealing
              ? 'brightness(1) saturate(1) hue-rotate(0deg)'
              : 'brightness(0.06) saturate(6) hue-rotate(290deg)',
            scale: isRevealing ? [1, 1.08, 1] : 1,
          }}
          transition={{ duration: isRevealing ? 0.9 : 0.3, ease: 'easeOut' }}
        />

        {/* Pink glow halo behind silhouette */}
        {!isRevealing && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-full"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: `radial-gradient(ellipse at center, ${zayaColor}55 0%, transparent 65%)`, filter: 'blur(20px)' }}
          />
        )}
      </motion.div>

      {/* ── BEFORE REVEAL: mystery text + input ── */}
      <AnimatePresence mode="wait">
        {!isRevealing && (
          <motion.div
            key="input-zone"
            className="relative z-10 flex flex-col items-center gap-5 px-6 w-full max-w-sm mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, delay: phase === 'enter' ? 0.8 : 0 }}
          >
            {/* Mystery text */}
            <div className="text-center">
              <motion.p
                className="text-[10px] uppercase tracking-[0.4em] font-bold mb-2"
                style={{ color: zayaColor + 'aa' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                ✦ Secret Challenger ✦
              </motion.p>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-tight">
                Do you know her name?
              </h2>
              <p className="text-gray-500 text-xs mt-1.5 italic">
                Hint: Xanny&apos;s little sister...
              </p>
            </div>

            {/* Input */}
            <motion.div
              className="w-full"
              animate={phase === 'wrong' ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type her name..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full text-center font-black text-xl uppercase tracking-widest bg-transparent outline-none rounded-2xl px-4 py-4 transition-all"
                style={{
                  border:      `2px solid ${phase === 'wrong' ? '#ef4444' : zayaColor}60`,
                  color:       phase === 'wrong' ? '#ef4444' : '#fff',
                  boxShadow:   phase === 'wrong'
                    ? '0 0 20px #ef444440'
                    : `0 0 20px ${zayaColor}25`,
                  background:  'rgba(255,255,255,0.04)',
                  caretColor:  zayaColor,
                }}
              />
              <AnimatePresence>
                {phase === 'wrong' && (
                  <motion.p
                    className="text-center text-xs font-bold mt-2"
                    style={{ color: '#ef4444' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    That&apos;s not it... try again 🤔
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Typing sparkle hints */}
            {input.length > 0 && input.length < 4 && (
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    animate={{ scale: i < input.length ? [1, 1.4, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ backgroundColor: i < input.length ? zayaColor : 'rgba(255,255,255,0.15)' }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── AFTER REVEAL: ZAYA UNLOCKED ── */}
        {isRevealing && (
          <motion.div
            key="reveal-zone"
            className="relative z-30 flex flex-col items-center gap-3 px-6 mt-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Burst rings */}
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{ border: `3px solid ${zayaColor}`, width: 80, height: 80 }}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 8, opacity: 0 }}
                transition={{ duration: 1.1, delay, ease: 'easeOut' }}
              />
            ))}

            <motion.div
              className="text-center"
              initial={{ y: 20 }} animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1
                className="font-black uppercase leading-none tracking-tighter"
                style={{ fontSize: 'clamp(3rem,16vw,6rem)', color: zayaColor, textShadow: `0 0 40px ${zayaColor}99, 0 0 80px ${zayaColor}55` }}
              >
                ZAYA
              </h1>
              <motion.p
                className="text-white font-black text-lg uppercase tracking-widest mt-1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                UNLOCKED! 🎀
              </motion.p>
              <motion.p
                className="text-xs mt-2 italic"
                style={{ color: zayaColor + 'aa' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Xanny&apos;s little sister has entered the game...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

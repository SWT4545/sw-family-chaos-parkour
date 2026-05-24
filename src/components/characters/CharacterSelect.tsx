'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Zap } from 'lucide-react'
import { CharacterCard } from './CharacterCard'
import { ZayaUnlockModal } from './ZayaUnlockModal'
import { CHARACTERS } from '@/lib/game/characters/characters'
import { ZayaUnlock } from '@/lib/game/characters/ZayaUnlock'
import { Character } from '@/types/player'

interface CharacterSelectProps {
  playerNumber?: 1 | 2
  onSelect: (character: Character) => void
  onBack: () => void
}

const ZAYA_COLOR = '#ec4899'

function MysterySlot({ onClick }: { onClick: () => void }) {
  const sparks = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i, angle: (i / 8) * 360, r: 38 + Math.random() * 16, delay: i * 0.22,
  })), [])

  return (
    <motion.button
      onClick={onClick}
      className="relative overflow-hidden rounded-xl border-2 cursor-pointer focus:outline-none flex-shrink-0 w-full h-full"
      style={{ borderColor: `${ZAYA_COLOR}40`, background: `radial-gradient(ellipse at 50% 60%, ${ZAYA_COLOR}18 0%, #060008 70%)`, boxShadow: `0 0 24px ${ZAYA_COLOR}20` }}
      whileHover={{ scale: 1.05, y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      aria-label="Mystery character — tap to discover"
    >
      {/* Animated border pulse */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{ boxShadow: [`0 0 12px ${ZAYA_COLOR}25`, `0 0 32px ${ZAYA_COLOR}55`, `0 0 12px ${ZAYA_COLOR}25`] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbiting sparkles */}
      {sparks.map(s => (
        <motion.div
          key={s.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: s.id % 2 === 0 ? ZAYA_COLOR : '#fbbf24',
            top:  `calc(50% + ${Math.sin(s.angle * Math.PI / 180) * s.r}px)`,
            left: `calc(50% + ${Math.cos(s.angle * Math.PI / 180) * s.r}px)`,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 1.8, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Silhouette question mark */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="font-black text-5xl leading-none"
          style={{ color: ZAYA_COLOR, textShadow: `0 0 24px ${ZAYA_COLOR}` }}
        >
          ?
        </motion.div>

        <motion.p
          className="text-[9px] uppercase tracking-[0.3em] font-bold mt-1"
          style={{ color: ZAYA_COLOR + '99' }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          SECRET
        </motion.p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-2 text-center pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
        <p className="text-[8px] uppercase tracking-widest font-bold" style={{ color: ZAYA_COLOR + '80' }}>
          Tap to Unlock
        </p>
      </div>
    </motion.button>
  )
}

export function CharacterSelect({ playerNumber = 1, onSelect, onBack }: CharacterSelectProps) {
  const [focused,         setFocused]         = useState<Character | null>(null)
  const [zayaUnlocked,    setZayaUnlocked]    = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [justUnlocked,    setJustUnlocked]    = useState(false)

  useEffect(() => { setZayaUnlocked(ZayaUnlock.isUnlocked()) }, [])

  const knownChars = CHARACTERS.filter(c => c.id !== 'zaya')
  const zayaChar   = CHARACTERS.find(c => c.id === 'zaya')!

  function handleZayaUnlocked() {
    setShowUnlockModal(false)
    setZayaUnlocked(true)
    setJustUnlocked(true)
    // Auto-focus Zaya after the modal closes
    setTimeout(() => { setFocused(zayaChar); setJustUnlocked(false) }, 400)
  }

  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Blurred poster bg */}
      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(16px)', transform: 'scale(1.05)' }}
      />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold leading-none">
            {playerNumber === 2 ? 'Player 2' : 'S&W Family Chaos Parkour'}
          </p>
          <h1 className="text-base sm:text-2xl font-black uppercase tracking-widest text-white leading-tight mt-0.5">
            {playerNumber === 2 ? 'Player 2 — Choose' : 'Choose Your Champion'}
          </h1>
        </div>
        <div className="w-16 sm:w-24" />
      </div>

      {/* Scrollable body */}
      <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
        <div
          className="flex flex-col items-center px-4 pt-3 sm:justify-center sm:min-h-full"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}
        >
          {/* Character grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center w-full sm:w-auto" style={{ gap: '18px', paddingBottom: '28px' }}>

            {/* Known characters */}
            {knownChars.map((char) => (
              <div key={char.id} className="aspect-[2/3] sm:aspect-auto sm:w-44 sm:h-60 md:w-48 md:h-64 sm:flex-shrink-0">
                <CharacterCard
                  character={char}
                  selected={focused?.id === char.id}
                  onSelect={() => setFocused(char)}
                  size="lg"
                  sizeClassName="w-full h-full"
                />
              </div>
            ))}

            {/* Zaya — mystery slot OR unlocked card */}
            <div className="aspect-[2/3] sm:aspect-auto sm:w-44 sm:h-60 md:w-48 md:h-64 sm:flex-shrink-0">
              <AnimatePresence mode="wait">
                {zayaUnlocked ? (
                  <motion.div
                    key="zaya-unlocked"
                    className="w-full h-full relative"
                    initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1,   opacity: 1, rotateY: 0  }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <CharacterCard
                      character={zayaChar}
                      selected={focused?.id === 'zaya'}
                      onSelect={() => setFocused(zayaChar)}
                      size="lg"
                      sizeClassName="w-full h-full"
                    />
                    {/* "NEW" badge after fresh unlock */}
                    <AnimatePresence>
                      {justUnlocked && (
                        <motion.div
                          className="absolute -top-2 -left-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                          style={{ backgroundColor: ZAYA_COLOR, color: '#000' }}
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                        >
                          NEW!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div key="zaya-mystery" className="w-full h-full" exit={{ scale: 0.5, opacity: 0, rotateY: -90 }} transition={{ duration: 0.35 }}>
                    <MysterySlot onClick={() => setShowUnlockModal(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Prompt */}
          {!focused && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-gray-500 text-sm text-center mt-8 uppercase tracking-widest">
              Tap a character to see their stats
            </motion.p>
          )}

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {focused && (
              <motion.div
                key={focused.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full max-w-xl"
                style={{ marginTop: '28px' }}
              >
                <div
                  className="rounded-2xl border backdrop-blur-md"
                  style={{ backgroundColor: 'rgba(10,10,10,0.88)', borderColor: `${focused.color}30`, padding: '24px' }}
                >
                  {/* Role + Name + Quote */}
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: focused.color }}>
                      {focused.role}
                    </p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase text-white leading-none">
                        {focused.name}
                      </h2>
                      {focused.id === 'zaya' && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${ZAYA_COLOR}25`, color: ZAYA_COLOR, border: `1px solid ${ZAYA_COLOR}50` }}>
                          SECRET
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-2 italic leading-snug">
                      &ldquo;{focused.tagline}&rdquo;
                    </p>
                  </div>

                  {/* Special Ability */}
                  <div className="w-full rounded-xl px-4 py-3" style={{ backgroundColor: `${focused.color}12`, border: `1px solid ${focused.color}35`, marginTop: '16px' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap size={12} style={{ color: focused.color }} />
                      <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: focused.color }}>Special Ability</span>
                    </div>
                    <p className="text-white font-black text-sm sm:text-base uppercase">{focused.ability}</p>
                    <p className="text-gray-400 text-xs mt-1 leading-snug">{focused.abilityDesc}</p>
                  </div>

                  {/* Select button */}
                  <motion.button
                    onClick={() => onSelect(focused)}
                    className="w-full rounded-xl font-black text-base uppercase tracking-widest text-black flex items-center justify-center"
                    style={{ backgroundColor: focused.id === 'zaya' ? ZAYA_COLOR : '#eab308', height: '60px', marginTop: '24px' }}
                    whileHover={{ scale: 1.02, filter: 'brightness(1.15)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    PLAY AS {focused.name.toUpperCase()} →
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Zaya Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <ZayaUnlockModal
            onUnlocked={handleZayaUnlocked}
            onClose={() => setShowUnlockModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

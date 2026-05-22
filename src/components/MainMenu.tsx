'use client'
import Image from 'next/image'
import { Settings } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'

interface MainMenuProps {
  onPlay:            () => void
  onLeaderboard:     () => void
  onDailyChallenges: () => void
  onSettings:        () => void
  onShop:            () => void
  onSeason:          () => void
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ─── Mobile layout ───────────────────────────────────────────────────────────
// Normal document flow: header → poster → actions → footer.
// No content overlaid on the poster.

function MobileMenu({ onPlay, onLeaderboard, onDailyChallenges, onSettings, onShop, onSeason }: MainMenuProps) {
  return (
    <div
      className="lg:hidden flex flex-col bg-black h-dvh overflow-y-auto"
      style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >
      {/* Header */}
      <motion.div
        className="flex-shrink-0 pb-1 text-center"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-yellow-400 font-bold">
          S &amp; W Family Presents
        </p>
      </motion.div>

      {/* Poster — fills remaining space, capped so actions always show */}
      <div
        className="relative flex-1 min-h-[200px] mx-0"
        style={{ maxHeight: '62dvh' }}
      >
        <Image
          src="/family-chaos-poster.png"
          alt="S&W Family Chaos Parkour"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Actions */}
      <motion.div
        className="flex-shrink-0 flex flex-col items-center px-6 pt-5 gap-0"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.p
          variants={fadeUp}
          className="text-gray-400 text-[11px] uppercase tracking-[0.35em] font-semibold mb-5"
        >
          Run. Dodge. Trap. Win.
        </motion.p>

        {/* Primary CTA */}
        <motion.button
          variants={fadeUp}
          onClick={onPlay}
          className="w-full max-w-xs font-black text-lg uppercase tracking-widest text-black bg-yellow-400"
          style={{ height: '64px', borderRadius: '20px' }}
          whileHover={{ scale: 1.04, backgroundColor: '#fbbf24' }}
          whileTap={{ scale: 0.97 }}
        >
          ▶ &nbsp;PLAY
        </motion.button>

        {/* Secondary buttons row 1 */}
        <motion.div variants={fadeUp} className="flex w-full max-w-xs mt-4" style={{ gap: '14px' }}>
          <button
            onClick={onLeaderboard}
            className="flex-1 font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10 rounded-xl"
            style={{ height: '56px' }}
          >
            Leaderboard
          </button>
          <button
            onClick={onDailyChallenges}
            className="flex-1 font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10 rounded-xl"
            style={{ height: '56px' }}
          >
            Daily 🎯
          </button>
        </motion.div>

        {/* Secondary buttons row 2 */}
        <motion.div variants={fadeUp} className="flex w-full max-w-xs mt-2" style={{ gap: '14px' }}>
          <button
            onClick={onShop}
            className="flex-1 font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10 rounded-xl"
            style={{ height: '48px' }}
          >
            Shop 🛍️
          </button>
          <button
            onClick={onSeason}
            className="flex-1 font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10 rounded-xl"
            style={{ height: '48px' }}
          >
            Season ⭐
          </button>
        </motion.div>

        {/* Settings + copyright row */}
        <motion.div variants={fadeUp} className="flex items-center justify-between w-full max-w-xs mt-3">
          <p className="text-gray-700 text-[10px]">© S&amp;W Family Chaos Parkour</p>
          <button
            onClick={onSettings}
            className="text-gray-600 hover:text-white transition-colors p-1.5"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────
// Cinematic full-bleed poster with gradient overlay + bottom navigation.

function DesktopMenu({ onPlay, onLeaderboard, onDailyChallenges, onSettings, onShop, onSeason }: MainMenuProps) {
  return (
    <div className="hidden lg:flex flex-col relative h-dvh overflow-hidden bg-black">
      {/* Full-bleed poster */}
      <div className="absolute inset-0">
        <Image
          src="/family-chaos-poster.png"
          alt="S&W Family Chaos Parkour"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* Top badge */}
      <motion.div
        className="relative z-10 text-center flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 28px)' }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-xs uppercase tracking-[0.4em] text-yellow-400 font-bold">
          S &amp; W Family Presents
        </p>
      </motion.div>

      <div className="flex-1" />

      {/* Bottom navigation */}
      <motion.div
        className="relative z-10 pb-10 px-6 flex flex-col items-center gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.p
          variants={fadeUp}
          className="text-gray-400 text-xs uppercase tracking-[0.35em] font-semibold"
        >
          Run. Dodge. Trap. Win.
        </motion.p>

        <motion.button
          variants={fadeUp}
          onClick={onPlay}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-xl uppercase tracking-widest text-black bg-yellow-400 relative overflow-hidden"
          whileHover={{ scale: 1.04, backgroundColor: '#fbbf24' }}
          whileTap={{ scale: 0.97 }}
        >
          ▶ &nbsp;PLAY
        </motion.button>

        <motion.div variants={fadeUp} className="flex gap-3 w-full max-w-xs">
          <button onClick={onLeaderboard} className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            Leaderboard
          </button>
          <button onClick={onDailyChallenges} className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            Daily 🎯
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-3 w-full max-w-xs">
          <button onClick={onShop} className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            Shop 🛍️
          </button>
          <button onClick={onSeason} className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            Season ⭐
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center justify-between w-full max-w-xs pt-1">
          <p className="text-gray-700 text-[10px]">© S&amp;W Family Chaos Parkour</p>
          <button onClick={onSettings} className="text-gray-600 hover:text-white transition-colors p-1" aria-label="Settings">
            <Settings size={15} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

export function MainMenu({ onPlay, onLeaderboard, onDailyChallenges, onSettings, onShop, onSeason }: MainMenuProps) {
  return (
    <>
      <MobileMenu  onPlay={onPlay} onLeaderboard={onLeaderboard} onDailyChallenges={onDailyChallenges} onSettings={onSettings} onShop={onShop} onSeason={onSeason} />
      <DesktopMenu onPlay={onPlay} onLeaderboard={onLeaderboard} onDailyChallenges={onDailyChallenges} onSettings={onSettings} onShop={onShop} onSeason={onSeason} />
    </>
  )
}

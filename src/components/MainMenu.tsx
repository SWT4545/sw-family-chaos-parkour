'use client'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

interface MainMenuProps {
  onPlay: () => void
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <div className="relative h-dvh flex flex-col overflow-hidden bg-black">
      {/* Full-bleed poster */}
      <div className="absolute inset-0">
        <Image
          src="/family-chaos-poster.png"
          alt="S&W Family Chaos Parkour"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* Top badge */}
      <motion.div
        className="relative z-10 pt-6 text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-yellow-400 font-bold">
          S & W Family Presents
        </p>
      </motion.div>

      {/* Push nav to bottom */}
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
          className="text-gray-400 text-[11px] sm:text-xs uppercase tracking-[0.35em] font-semibold"
        >
          Run. Dodge. Trap. Win.
        </motion.p>

        {/* Primary CTA */}
        <motion.button
          variants={fadeUp}
          onClick={onPlay}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-widest text-black bg-yellow-400 relative overflow-hidden"
          whileHover={{ scale: 1.04, backgroundColor: '#fbbf24' }}
          whileTap={{ scale: 0.97 }}
        >
          ▶ &nbsp;PLAY
        </motion.button>

        {/* Secondary buttons */}
        <motion.div variants={fadeUp} className="flex gap-3 w-full max-w-xs">
          <button className="flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            How to Play
          </button>
          <button className="flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
            Leaderboard
          </button>
        </motion.div>

        <motion.p variants={fadeUp} className="text-gray-700 text-[10px] pt-1">
          © S&W Family Chaos Parkour
        </motion.p>
      </motion.div>
    </div>
  )
}

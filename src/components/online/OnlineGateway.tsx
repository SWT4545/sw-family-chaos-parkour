'use client'
import { motion } from 'framer-motion'
import { ChevronLeft, Plus, Hash, Wifi } from 'lucide-react'

interface Props {
  onCreate: () => void
  onJoin:   () => void
  onBack:   () => void
}

export function OnlineGateway({ onCreate, onJoin, onBack }: Props) {
  return (
    <div
      className="relative h-dvh bg-[#080808] flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'url(/family-chaos-poster.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', transform: 'scale(1.05)' }}
      />

      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Wifi size={12} className="text-green-400" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Online Play</span>
        </div>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 px-6">

        {/* Title */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Family Lobby</h1>
          <p className="text-gray-500 text-sm mt-1">Play with family on any device</p>
        </div>

        {/* How it works */}
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] px-5 py-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold mb-3">How It Works</p>
          <div className="flex flex-col gap-2">
            {[
              { step: '1', text: 'One person creates a room — gets a 5-letter code' },
              { step: '2', text: 'Everyone else joins using that code' },
              { step: '3', text: 'Host starts the match when all are ready' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-black text-yellow-400">{s.step}</span>
                </div>
                <p className="text-gray-400 text-xs leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <motion.button
          onClick={onCreate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-sm rounded-2xl border p-5 text-left"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)', borderColor: '#fbbf2440' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-yellow-400/15 border border-yellow-400/35">
              <Plus size={26} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-wider leading-tight">Create Room</h2>
              <p className="text-gray-500 text-xs mt-0.5">You&rsquo;re the host — share the code with family</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          onClick={onJoin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-sm rounded-2xl border p-5 text-left"
          style={{ backgroundColor: 'rgba(10,10,10,0.85)', borderColor: '#8b5cf640' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/15 border border-purple-500/35">
              <Hash size={26} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-wider leading-tight">Join Room</h2>
              <p className="text-gray-500 text-xs mt-0.5">Enter the 5-letter code your family shared</p>
            </div>
          </div>
        </motion.button>

      </div>
    </div>
  )
}

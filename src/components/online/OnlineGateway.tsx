'use client'
import { motion } from 'framer-motion'
import { ChevronLeft, Plus, Hash } from 'lucide-react'

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
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-yellow-500 font-bold">Online Family Play</p>
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">Family Lobby</h1>
        </div>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-gray-500 text-sm text-center max-w-xs">
          Create a room and share the code with family,<br />or join an existing room.
        </p>

        {[
          { label: 'Create Room', sub: 'Get a 5-letter code to share', icon: <Plus size={26} />, color: '#fbbf24', action: onCreate },
          { label: 'Join Room',   sub: 'Enter a room code from family', icon: <Hash size={26} />, color: '#8b5cf6', action: onJoin },
        ].map((item, i) => (
          <motion.button
            key={item.label}
            onClick={item.action}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full max-w-sm rounded-2xl border p-5 text-left"
            style={{ backgroundColor: 'rgba(10,10,10,0.85)', borderColor: `${item.color}35` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}18`, color: item.color, border: `1.5px solid ${item.color}40` }}
              >
                {item.icon}
              </div>
              <div>
                <h2 className="font-black text-white text-lg uppercase tracking-wider leading-tight">{item.label}</h2>
                <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

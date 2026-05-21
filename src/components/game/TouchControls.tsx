'use client'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowUp, Zap } from 'lucide-react'

function fireKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }))
}

interface BtnProps {
  onStart: () => void
  onEnd: () => void
  className?: string
  children: React.ReactNode
  label: string
}

function TouchBtn({ onStart, onEnd, className = '', children, label }: BtnProps) {
  return (
    <button
      aria-label={label}
      className={`select-none touch-none active:scale-90 transition-transform flex items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white ${className}`}
      onPointerDown={(e) => { e.preventDefault(); onStart() }}
      onPointerUp={(e)   => { e.preventDefault(); onEnd() }}
      onPointerLeave={(e) => { e.preventDefault(); onEnd() }}
    >
      {children}
    </button>
  )
}

// Shows controls for both players simultaneously (portrait/landscape touch play)
export function TouchControls() {
  const p = useCallback((k: string) => fireKey(k, 'keydown'), [])
  const r = useCallback((k: string) => fireKey(k, 'keyup'),   [])

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-3 pb-3 sm:hidden z-20">

      {/* ── P1 cluster (left) ── */}
      <div className="pointer-events-auto flex flex-col items-start gap-1.5">
        <p className="text-[9px] uppercase tracking-widest text-yellow-400 font-bold ml-1">P1</p>
        <div className="flex items-end gap-1.5">
          {/* Movement */}
          <div className="flex items-center gap-1.5">
            <TouchBtn label="P1 Left" className="w-11 h-11"
              onStart={() => p('a')} onEnd={() => r('a')}>
              <ChevronLeft size={18} />
            </TouchBtn>
            <TouchBtn label="P1 Right" className="w-11 h-11"
              onStart={() => p('d')} onEnd={() => r('d')}>
              <ChevronRight size={18} />
            </TouchBtn>
          </div>
          {/* Jump */}
          <TouchBtn label="P1 Jump" className="w-11 h-11 bg-yellow-400/20 border-yellow-400/40"
            onStart={() => p(' ')} onEnd={() => r(' ')}>
            <ArrowUp size={16} className="text-yellow-400" />
          </TouchBtn>
          {/* Trap */}
          <TouchBtn label="P1 Trap" className="w-11 h-11 bg-red-500/20 border-red-500/40"
            onStart={() => p('q')} onEnd={() => r('q')}>
            <Zap size={14} className="text-red-400" />
          </TouchBtn>
        </div>
      </div>

      {/* ── P2 cluster (right) ── */}
      <div className="pointer-events-auto flex flex-col items-end gap-1.5">
        <p className="text-[9px] uppercase tracking-widest text-blue-400 font-bold mr-1">P2</p>
        <div className="flex items-end gap-1.5">
          {/* Trap */}
          <TouchBtn label="P2 Trap" className="w-11 h-11 bg-red-500/20 border-red-500/40"
            onStart={() => p('/')} onEnd={() => r('/')}>
            <Zap size={14} className="text-red-400" />
          </TouchBtn>
          {/* Jump */}
          <TouchBtn label="P2 Jump" className="w-11 h-11 bg-blue-400/20 border-blue-400/40"
            onStart={() => p('ArrowUp')} onEnd={() => r('ArrowUp')}>
            <ArrowUp size={16} className="text-blue-400" />
          </TouchBtn>
          {/* Movement */}
          <div className="flex items-center gap-1.5">
            <TouchBtn label="P2 Left" className="w-11 h-11"
              onStart={() => p('ArrowLeft')} onEnd={() => r('ArrowLeft')}>
              <ChevronLeft size={18} />
            </TouchBtn>
            <TouchBtn label="P2 Right" className="w-11 h-11"
              onStart={() => p('ArrowRight')} onEnd={() => r('ArrowRight')}>
              <ChevronRight size={18} />
            </TouchBtn>
          </div>
        </div>
      </div>

    </div>
  )
}

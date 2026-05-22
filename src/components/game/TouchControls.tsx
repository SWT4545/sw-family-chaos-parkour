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
      onPointerCancel={(e) => { e.preventDefault(); onEnd() }}
    >
      {children}
    </button>
  )
}

interface TouchControlsProps {
  mode?: 'solo' | '1v1' | 'online'
}

export function TouchControls({ mode = 'solo' }: TouchControlsProps) {
  const p = useCallback((k: string) => fireKey(k, 'keydown'), [])
  const r = useCallback((k: string) => fireKey(k, 'keyup'),   [])

  const showP2 = mode === '1v1'

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-3 pb-safe-bottom md:hidden z-20"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>

      {/* ── P1 cluster (left) ── */}
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-bold ml-1">P1</p>
        <div className="flex items-end gap-2">
          {/* D-pad: Left + Right */}
          <div className="flex items-center gap-2">
            <TouchBtn label="P1 Left" className="w-14 h-14 active:bg-white/20"
              onStart={() => p('a')} onEnd={() => r('a')}>
              <ChevronLeft size={24} />
            </TouchBtn>
            <TouchBtn label="P1 Right" className="w-14 h-14 active:bg-white/20"
              onStart={() => p('d')} onEnd={() => r('d')}>
              <ChevronRight size={24} />
            </TouchBtn>
          </div>
          {/* Jump */}
          <TouchBtn label="P1 Jump" className="w-14 h-14 bg-yellow-400/20 border-yellow-400/50 active:bg-yellow-400/40"
            onStart={() => p(' ')} onEnd={() => r(' ')}>
            <ArrowUp size={22} className="text-yellow-300" />
          </TouchBtn>
          {/* Trap */}
          <TouchBtn label="P1 Trap" className="w-14 h-14 bg-red-500/20 border-red-500/50 active:bg-red-500/40"
            onStart={() => p('q')} onEnd={() => r('q')}>
            <Zap size={20} className="text-red-400" />
          </TouchBtn>
        </div>
      </div>

      {/* ── P2 cluster (right) — 1v1 only ── */}
      {showP2 ? (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <p className="text-[11px] uppercase tracking-widest text-blue-400 font-bold mr-1">P2</p>
          <div className="flex items-end gap-2">
            {/* Trap */}
            <TouchBtn label="P2 Trap" className="w-14 h-14 bg-red-500/20 border-red-500/50 active:bg-red-500/40"
              onStart={() => p('/')} onEnd={() => r('/')}>
              <Zap size={20} className="text-red-400" />
            </TouchBtn>
            {/* Jump */}
            <TouchBtn label="P2 Jump" className="w-14 h-14 bg-blue-400/20 border-blue-400/50 active:bg-blue-400/40"
              onStart={() => p('ArrowUp')} onEnd={() => r('ArrowUp')}>
              <ArrowUp size={22} className="text-blue-300" />
            </TouchBtn>
            {/* D-pad: Left + Right */}
            <div className="flex items-center gap-2">
              <TouchBtn label="P2 Left" className="w-14 h-14 active:bg-white/20"
                onStart={() => p('ArrowLeft')} onEnd={() => r('ArrowLeft')}>
                <ChevronLeft size={24} />
              </TouchBtn>
              <TouchBtn label="P2 Right" className="w-14 h-14 active:bg-white/20"
                onStart={() => p('ArrowRight')} onEnd={() => r('ArrowRight')}>
                <ChevronRight size={24} />
              </TouchBtn>
            </div>
          </div>
        </div>
      ) : (
        <div />
      )}

    </div>
  )
}

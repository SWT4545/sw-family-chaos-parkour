'use client'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowUp, Zap } from 'lucide-react'

function fireKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }))
}

interface BtnProps {
  onStart:   () => void
  onEnd:     () => void
  children:  React.ReactNode
  label:     string
  style?:    React.CSSProperties
  className?: string
}

function Btn({ onStart, onEnd, children, label, style, className = '' }: BtnProps) {
  return (
    <button
      aria-label={label}
      className={`select-none touch-none transition-all duration-75 active:scale-90 active:brightness-125
        flex flex-col items-center justify-center rounded-2xl text-white font-black ${className}`}
      style={style}
      onPointerDown={(e)  => { e.preventDefault(); onStart() }}
      onPointerUp={(e)    => { e.preventDefault(); onEnd() }}
      onPointerLeave={(e) => { e.preventDefault(); onEnd() }}
      onPointerCancel={(e) => { e.preventDefault(); onEnd() }}
    >
      {children}
    </button>
  )
}

// Single-player controller cluster (left = dpad, right = actions)
function P1Cluster({ p, r, accentColor = '#fbbf24' }: {
  p: (k: string) => void
  r: (k: string) => void
  accentColor?: string
}) {
  return (
    <div className="pointer-events-auto flex items-end gap-3">

      {/* D-pad */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: accentColor }}>MOVE</span>
        <div className="flex gap-2">
          <Btn label="Left" onStart={() => p('a')} onEnd={() => r('a')}
            className="w-[68px] h-[68px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            <ChevronLeft size={30} />
          </Btn>
          <Btn label="Right" onStart={() => p('d')} onEnd={() => r('d')}
            className="w-[68px] h-[68px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            <ChevronRight size={30} />
          </Btn>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-2">
        {/* Trap — X button */}
        <Btn label="Trap" onStart={() => p('q')} onEnd={() => r('q')}
          className="w-[68px] h-[68px]"
          style={{
            background: 'rgba(239,68,68,0.30)',
            border: '2px solid rgba(239,68,68,0.65)',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,150,150,0.2)',
          }}>
          <Zap size={26} className="text-red-300" />
          <span className="text-[9px] uppercase tracking-wider text-red-400 leading-none mt-0.5">TRAP</span>
        </Btn>
        {/* Jump — A button */}
        <Btn label="Jump" onStart={() => p(' ')} onEnd={() => r(' ')}
          className="w-[80px] h-[80px]"
          style={{
            background: `rgba(251,191,36,0.30)`,
            border: '2.5px solid rgba(251,191,36,0.75)',
            boxShadow: '0 4px 18px rgba(251,191,36,0.40), inset 0 1px 0 rgba(255,240,100,0.25)',
          }}>
          <ArrowUp size={30} className="text-yellow-300" />
          <span className="text-[9px] uppercase tracking-wider text-yellow-400 leading-none mt-0.5">JUMP</span>
        </Btn>
      </div>

    </div>
  )
}

// Mirrored cluster for P2 (actions on left, dpad on right)
function P2Cluster({ p, r }: { p: (k: string) => void; r: (k: string) => void }) {
  return (
    <div className="pointer-events-auto flex items-end gap-3">

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-2">
        {/* Trap */}
        <Btn label="P2 Trap" onStart={() => p('/')} onEnd={() => r('/')}
          className="w-[68px] h-[68px]"
          style={{
            background: 'rgba(239,68,68,0.30)',
            border: '2px solid rgba(239,68,68,0.65)',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,150,150,0.2)',
          }}>
          <Zap size={26} className="text-red-300" />
          <span className="text-[9px] uppercase tracking-wider text-red-400 leading-none mt-0.5">TRAP</span>
        </Btn>
        {/* Jump */}
        <Btn label="P2 Jump" onStart={() => p('ArrowUp')} onEnd={() => r('ArrowUp')}
          className="w-[80px] h-[80px]"
          style={{
            background: 'rgba(96,165,250,0.30)',
            border: '2.5px solid rgba(96,165,250,0.75)',
            boxShadow: '0 4px 18px rgba(96,165,250,0.40), inset 0 1px 0 rgba(150,200,255,0.25)',
          }}>
          <ArrowUp size={30} className="text-blue-300" />
          <span className="text-[9px] uppercase tracking-wider text-blue-400 leading-none mt-0.5">JUMP</span>
        </Btn>
      </div>

      {/* D-pad */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 mb-0.5">MOVE</span>
        <div className="flex gap-2">
          <Btn label="P2 Left" onStart={() => p('ArrowLeft')} onEnd={() => r('ArrowLeft')}
            className="w-[68px] h-[68px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            <ChevronLeft size={30} />
          </Btn>
          <Btn label="P2 Right" onStart={() => p('ArrowRight')} onEnd={() => r('ArrowRight')}
            className="w-[68px] h-[68px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            <ChevronRight size={30} />
          </Btn>
        </div>
      </div>

    </div>
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
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex lg:hidden z-20"
      style={{
        justifyContent: showP2 ? 'space-between' : 'flex-start',
        alignItems: 'flex-end',
        paddingLeft:   showP2 ? '8px'  : '12px',
        paddingRight:  showP2 ? '8px'  : '12px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      <P1Cluster p={p} r={r} />
      {showP2 && <P2Cluster p={p} r={r} />}
    </div>
  )
}

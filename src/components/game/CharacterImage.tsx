'use client'
import Image from 'next/image'
import { alignmentToCSS, type AssetAlignment } from '@/lib/game/assets/AssetRegistry'

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_IMAGE_ALIGNMENT === 'true'

interface DebugOverlayProps {
  offsetX: number; offsetY: number
  anchorX: number; anchorY: number
  scale:   number
}

function DebugOverlay({ offsetX, offsetY, anchorX, anchorY, scale }: DebugOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Bounding box */}
      <div className="absolute inset-0 border border-red-500/80" />
      {/* Horizontal center line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-400/70" />
      {/* Vertical center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-400/70" />
      {/* Center dot */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
      {/* Anchor dot */}
      <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-400 border border-blue-200"
        style={{ left: `${anchorX * 100}%`, top: `${anchorY * 100}%`, transform: 'translate(-50%,-50%)' }} />
      {/* Offset + scale label */}
      <div className="absolute bottom-0 left-0 bg-black/80 px-1 py-0.5">
        <p className="text-[7px] font-mono text-red-400 leading-none">
          x{offsetX} y{offsetY} s{scale}
        </p>
      </div>
    </div>
  )
}

export interface CharacterImageProps extends Partial<AssetAlignment> {
  src:           string
  alt:           string
  priority?:     boolean
  sizes?:        string
  objectPosition?: string   // CSS object-position on the Image
}

/**
 * Drop-in replacement for Next.js <Image fill> that applies registry-defined
 * alignment offsets and scale.  Must be inside a `relative overflow-hidden` parent.
 */
export function CharacterImage({
  src, alt,
  offsetX  = 0,
  offsetY  = 0,
  scale    = 1,
  anchorX  = 0.5,
  anchorY  = 0.5,
  priority = false,
  sizes,
  objectPosition = 'center top',
}: CharacterImageProps) {
  const { transform, transformOrigin } = alignmentToCSS({ offsetX, offsetY, scale, anchorX, anchorY })

  return (
    <>
      {/* Transform wrapper — fills parent, applies alignment */}
      <div
        className="absolute inset-0"
        style={{ transform, transformOrigin, willChange: 'transform' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          style={{ objectPosition }}
          priority={priority}
          sizes={sizes ?? '(max-width: 640px) 160px, 240px'}
        />
      </div>

      {/* Debug overlay — only visible when env var is set */}
      {DEBUG && (
        <DebugOverlay offsetX={offsetX} offsetY={offsetY} anchorX={anchorX} anchorY={anchorY} scale={scale} />
      )}
    </>
  )
}

'use client'
import { useEffect, useRef, MutableRefObject } from 'react'
import { ThreePrimitiveCharacterRenderer } from '@/lib/game/rendering/ThreePrimitiveCharacterRenderer'
import type { GameRenderState } from '@/lib/game/rendering/GameRenderState'

interface Props {
  gameRenderRef: MutableRefObject<GameRenderState>
}

export function ThreeCharacterLayer({ gameRenderRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new ThreePrimitiveCharacterRenderer(canvas)
    let rafId: number
    let running = true

    function loop() {
      if (!running) return
      renderer.update(gameRenderRef.current)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      renderer.dispose()
    }
  }, [gameRenderRef])

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={540}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: 'block' }}
    />
  )
}

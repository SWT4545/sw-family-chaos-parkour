export interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  color: string; size: number
}

export function burst(
  x: number, y: number,
  color: string,
  count = 12,
  speedMin = 1.5, speedMax = 6,
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = speedMin + Math.random() * (speedMax - speedMin)
    const life  = 0.5 + Math.random() * 0.7
    return {
      x, y,
      vx:   Math.cos(angle) * speed,
      vy:   Math.sin(angle) * speed - 2.5,
      life, maxLife: life,
      color,
      size: 2 + Math.random() * 5,
    }
  })
}

export function updateParticles(particles: Particle[], dtSecs: number): Particle[] {
  const out: Particle[] = []
  for (const p of particles) {
    const life = p.life - dtSecs
    if (life <= 0) continue
    out.push({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life })
  }
  return out
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

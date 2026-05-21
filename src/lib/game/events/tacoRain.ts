export interface TacoEntity {
  x:       number
  y:       number
  vx:      number
  vy:      number
  rot:     number
  rotV:    number
  active:  boolean  // false once splattered or off-screen
}

export const TACO_RAIN_MIN_MS = 45_000
export const TACO_RAIN_MAX_MS = 80_000
export const TACO_COUNT       = 12
export const TACO_RADIUS      = 13   // collision + render radius

export function spawnTacoRain(camX: number, canvasW: number): TacoEntity[] {
  return Array.from({ length: TACO_COUNT }, (_, i) => ({
    x:      camX + (i / TACO_COUNT) * canvasW + (Math.random() - 0.5) * 80,
    y:      -50 - Math.random() * 120,
    vx:     (Math.random() - 0.5) * 3.5,
    vy:     3 + Math.random() * 3,
    rot:    Math.random() * Math.PI * 2,
    rotV:   (Math.random() - 0.5) * 0.18,
    active: true,
  }))
}

export function updateTacos(tacos: TacoEntity[], mapH: number): TacoEntity[] {
  return tacos.map((t) => {
    if (!t.active) return t
    const y = t.y + t.vy
    if (y > mapH + 40) return { ...t, active: false }
    return { ...t, x: t.x + t.vx, y, rot: t.rot + t.rotV }
  })
}

export function drawTaco(ctx: CanvasRenderingContext2D, taco: TacoEntity): void {
  if (!taco.active) return
  ctx.save()
  ctx.translate(taco.x, taco.y)
  ctx.rotate(taco.rot)

  // Shell
  ctx.beginPath()
  ctx.ellipse(0, 0, TACO_RADIUS, TACO_RADIUS * 0.6, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#d97706'
  ctx.fill()
  ctx.strokeStyle = '#92400e'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Filling
  ctx.beginPath()
  ctx.ellipse(0, -2, TACO_RADIUS * 0.75, TACO_RADIUS * 0.35, 0, Math.PI, Math.PI * 2)
  ctx.fillStyle = '#16a34a'
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(0, -2, TACO_RADIUS * 0.5, TACO_RADIUS * 0.25, 0, Math.PI, Math.PI * 2)
  ctx.fillStyle = '#dc2626'
  ctx.fill()

  ctx.restore()
}

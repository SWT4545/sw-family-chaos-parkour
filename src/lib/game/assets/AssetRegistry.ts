import type { CharacterId } from '@/types/player'

export interface AssetAlignment {
  offsetX:  number   // horizontal shift in px (positive = right)
  offsetY:  number   // vertical shift in px (positive = down)
  scale:    number   // uniform scale (1.0 = natural)
  anchorX:  number   // scale/rotate pivot, 0-1 (0 = left, 0.5 = center, 1 = right)
  anchorY:  number   // scale/rotate pivot, 0-1 (0 = top,  0.5 = center, 1 = bottom)
}

// All offsets reset to neutral — normalized assets are pre-cropped and centered.
// Adjust per-character here if fine-tuning is needed after visual review.
export const CHARACTER_ALIGNMENT: Record<CharacterId, AssetAlignment> = {
  commander: { offsetX: 0, offsetY: 0, scale: 1, anchorX: 0.5, anchorY: 0.5 },
  bj:        { offsetX: 0, offsetY: 0, scale: 1, anchorX: 0.5, anchorY: 0.5 },
  brae:      { offsetX: 0, offsetY: 0, scale: 1, anchorX: 0.5, anchorY: 0.5 },
  xanny:     { offsetX: 0, offsetY: 0, scale: 1, anchorX: 0.5, anchorY: 0.5 },
}

/** Returns the CSS transform and transformOrigin strings for a given alignment. */
export function alignmentToCSS(a: AssetAlignment): { transform: string; transformOrigin: string } {
  return {
    transform:       `translate(${a.offsetX}px, ${a.offsetY}px) scale(${a.scale})`,
    transformOrigin: `${a.anchorX * 100}% ${a.anchorY * 100}%`,
  }
}

/** Apply canvas alignment before ctx.drawImage().
 *  Call inside a ctx.save() / ctx.restore() block that has already been clipped. */
export function applyCanvasAlignment(
  ctx:    CanvasRenderingContext2D,
  cx:     number,  // horizontal center of draw rect
  cy:     number,  // vertical center of draw rect
  w:      number,  // draw rect width
  h:      number,  // draw rect height
  a:      AssetAlignment,
): void {
  // Anchor in world space
  const ax = cx - w / 2 + a.anchorX * w
  const ay = cy - h / 2 + a.anchorY * h
  ctx.translate(ax + a.offsetX, ay + a.offsetY)
  ctx.scale(a.scale, a.scale)
  ctx.translate(-ax, -ay)
}

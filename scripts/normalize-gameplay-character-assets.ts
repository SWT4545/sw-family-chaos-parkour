/**
 * Gameplay-specific character asset normalizer.
 *
 * Unlike the UI normalizer (normalize-character-assets.ts) which centers
 * characters on a large canvas, this script is foot-aligned:
 *
 *   - Detects content bounding box via alpha channel only
 *   - Crops away transparent margins on all sides EXCEPT the bottom
 *     (a tiny foot-pad of 4px is kept so the character sits just above ground)
 *   - Centers the character horizontally on a fixed-width canvas (500px)
 *   - Character height varies per-character preserving natural proportions
 *   - Output: 500 × characterHeight, transparent PNG
 *
 * This ensures: when GameCanvas draws the sprite with pivot at the BOTTOM
 * edge of the rect (feet), the feet land exactly on the physics ground line.
 *
 * Input:  public/game-assets/characters-normalized/{id}/{id}-full.png
 * Output: public/game-assets/characters-gameplay/{id}/{id}-full.png
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const SRC_ROOT     = path.resolve('public/game-assets/characters-normalized')
const OUT_ROOT     = path.resolve('public/game-assets/characters-gameplay')
const CHARACTERS   = ['commander', 'bj', 'brae', 'xanny']

const OUT_WIDTH    = 500   // fixed output width
const SIDE_PAD     = 12    // px added left + right of content bbox
const TOP_PAD      = 20    // px added above character head
const FOOT_PAD     = 4     // px added below character feet (keeps feet off the very edge)

// ─── Background removal ───────────────────────────────────────────────────────
// Pass 1: BFS from all edges — marks every edge-reachable white/transparent pixel
//         as background.
// Pass 2: flood-fill from every transparent pixel into adjacent near-white pixels
//         (removes "internal" gaps such as spaces between arms/body/legs that the
//         BFS cannot reach because they are not edge-adjacent).
// Returns a Uint8Array: 1 = background (should become transparent), 0 = foreground.

function isNearWhite(r: number, g: number, b: number, a: number): boolean {
  if (a < 10) return true             // fully transparent
  if (r > 230 && g > 230 && b > 230) return true  // near-white
  return false
}

function buildFullBackgroundMask(
  data: Buffer,
  width: number,
  height: number,
): Uint8Array {
  const bg     = new Uint8Array(width * height)
  const total  = width * height
  const queue  = new Int32Array(total)
  let head = 0, tail = 0

  function enqueue(idx: number) {
    const p = idx * 4
    if (!bg[idx] && isNearWhite(data[p], data[p+1], data[p+2], data[p+3])) {
      bg[idx] = 1; queue[tail++] = idx
    }
  }

  // ── Pass 1: seed from all four edges ─────────────────────────────
  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  // BFS expansion
  while (head < tail) {
    const idx = queue[head++]
    const x = idx % width, y = Math.floor(idx / width)
    if (x > 0)         enqueue(idx - 1)
    if (x < width - 1) enqueue(idx + 1)
    if (y > 0)         enqueue(idx - width)
    if (y < height-1)  enqueue(idx + width)
  }

  // ── Pass 2: flood-fill outward from all transparent pixels into
  //    adjacent near-white pixels (removes open internal gaps) ────────
  head = tail = 0
  for (let i = 0; i < total; i++) {
    if (bg[i] === 1) { queue[tail++] = i }
  }
  while (head < tail) {
    const idx = queue[head++]
    const x = idx % width, y = Math.floor(idx / width)
    const neighbors = [
      x > 0         ? idx - 1        : -1,
      x < width - 1 ? idx + 1        : -1,
      y > 0         ? idx - width     : -1,
      y < height - 1? idx + width     : -1,
    ]
    for (const n of neighbors) {
      if (n < 0 || bg[n] === 1) continue
      const p = n * 4
      if (isNearWhite(data[p], data[p+1], data[p+2], data[p+3])) {
        bg[n] = 1; queue[tail++] = n
      }
    }
  }

  // ── Pass 3: erode isolated white regions — iteratively remove near-white
  //    pixels that have no colored (clearly non-white) 8-neighbor.
  //    Repeat until stable. This removes enclosed white "holes" inside
  //    characters where the outline is colored but the interior is white. ──
  let changed = true
  while (changed) {
    changed = false
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (bg[idx] === 1) continue                // already background
        const p = idx * 4
        if (!isNearWhite(data[p], data[p+1], data[p+2], data[p+3])) continue  // colored — keep

        // This is a foreground near-white pixel. Check all 8 neighbors.
        // If no 8-neighbor is clearly colored (non-white, non-transparent, not already bg),
        // then this pixel is isolated white — absorb into background.
        let hasColoredNeighbor = false
        for (let dy = -1; dy <= 1 && !hasColoredNeighbor; dy++) {
          for (let dx = -1; dx <= 1 && !hasColoredNeighbor; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx, ny = y + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const ni = ny * width + nx
            if (bg[ni] === 1) continue  // neighbor is bg
            const np = ni * 4
            const nr = data[np], ng = data[np+1], nb = data[np+2], na = data[np+3]
            if (na > 10 && !(nr > 230 && ng > 230 && nb > 230)) {
              hasColoredNeighbor = true
            }
          }
        }
        if (!hasColoredNeighbor) {
          bg[idx] = 1
          changed = true
        }
      }
    }
  }

  return bg
}

// ─── Bounding box of foreground pixels ────────────────────────────────────────

interface BBox { left: number; top: number; right: number; bottom: number }

function findAlphaBBox(data: Buffer, bg: Uint8Array, width: number, height: number): BBox | null {
  let left = width, top = height, right = 0, bottom = 0, found = false
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!bg[idx] && data[idx * 4 + 3] > 8) {
        if (x < left)   left   = x
        if (x > right)  right  = x
        if (y < top)    top    = y
        if (y > bottom) bottom = y
        found = true
      }
    }
  }
  return found ? { left, top, right, bottom } : null
}

// ─── Process one character ────────────────────────────────────────────────────

async function processCharacter(id: string): Promise<void> {
  const srcPath = path.join(SRC_ROOT, id, `${id}-full.png`)
  if (!fs.existsSync(srcPath)) {
    console.warn(`  ⚠  Missing: ${srcPath}`)
    return
  }

  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Build background mask (two-pass: edge BFS + internal gap fill)
  const bg   = buildFullBackgroundMask(data, info.width, info.height)
  const bbox = findAlphaBBox(data, bg, info.width, info.height)

  if (!bbox) {
    console.warn(`  ⚠  No foreground found in ${id}-full.png`)
    return
  }

  // Apply mask: zero-out alpha on all background pixels
  const cleaned = Buffer.from(data)
  for (let i = 0; i < info.width * info.height; i++) {
    if (bg[i] === 1) cleaned[i * 4 + 3] = 0
  }

  // Count remaining pixels for logging
  let bgRemoved = 0
  for (let i = 0; i < bg.length; i++) { if (bg[i]) bgRemoved++ }
  console.log(
    `  ${id}: removed ${bgRemoved} bg pixels (${(bgRemoved/(info.width*info.height)*100).toFixed(1)}%)` +
    ` content=[${bbox.left},${bbox.top}]-[${bbox.right},${bbox.bottom}]`
  )

  // Crop bounds — feet at bottom, minimal padding
  const cropLeft   = Math.max(0, bbox.left   - SIDE_PAD)
  const cropTop    = Math.max(0, bbox.top    - TOP_PAD)
  const cropRight  = Math.min(info.width  - 1, bbox.right  + SIDE_PAD)
  const cropBottom = Math.min(info.height - 1, bbox.bottom + FOOT_PAD)

  const cropW = cropRight  - cropLeft + 1
  const cropH = cropBottom - cropTop  + 1

  const scale     = OUT_WIDTH / cropW
  const outHeight = Math.round(cropH * scale)

  console.log(`  → crop ${cropW}×${cropH} → output ${OUT_WIDTH}×${outHeight}`)

  // Write cleaned RGBA to a temp buffer, extract crop, scale
  const cleanedPng = await sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()

  const cropped = await sharp(cleanedPng)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .toBuffer()

  const outDir  = path.join(OUT_ROOT, id)
  const outPath = path.join(outDir, `${id}-full.png`)
  fs.mkdirSync(outDir, { recursive: true })

  await sharp(cropped)
    .resize(OUT_WIDTH, outHeight, { fit: 'fill' })
    .png({ compressionLevel: 8 })
    .toFile(outPath)

  console.log(`  ✓  Written ${outPath} (${OUT_WIDTH}×${outHeight})`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Normalizing gameplay character assets (foot-aligned)…\n')
  fs.mkdirSync(OUT_ROOT, { recursive: true })

  for (const id of CHARACTERS) {
    console.log(`── ${id}`)
    try {
      await processCharacter(id)
    } catch (err) {
      console.error(`  ✗  ${id}:`, err)
    }
    console.log()
  }

  console.log('Done. Gameplay assets written to public/game-assets/characters-gameplay/')
}

main().catch((e) => { console.error(e); process.exit(1) })

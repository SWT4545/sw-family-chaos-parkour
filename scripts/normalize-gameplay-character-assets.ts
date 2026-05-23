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

// ─── Alpha-only bounding box ──────────────────────────────────────────────────

interface BBox { left: number; top: number; right: number; bottom: number }

function findAlphaBBox(data: Buffer, width: number, height: number): BBox | null {
  let left = width, top = height, right = 0, bottom = 0, found = false
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 8) {
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

  const bbox = findAlphaBBox(data, info.width, info.height)
  if (!bbox) {
    console.warn(`  ⚠  No content found in ${id}-full.png`)
    return
  }

  // Crop bounds — feet aligned (minimal bottom padding)
  const cropLeft   = Math.max(0, bbox.left   - SIDE_PAD)
  const cropTop    = Math.max(0, bbox.top    - TOP_PAD)
  const cropRight  = Math.min(info.width  - 1, bbox.right  + SIDE_PAD)
  const cropBottom = Math.min(info.height - 1, bbox.bottom + FOOT_PAD)

  const cropW = cropRight  - cropLeft + 1
  const cropH = cropBottom - cropTop  + 1

  const contentW = bbox.right  - bbox.left + 1
  const contentH = bbox.bottom - bbox.top  + 1

  // Scale factor to fit cropW within OUT_WIDTH (no upscale if already smaller)
  const scale     = OUT_WIDTH / cropW
  const outHeight = Math.round(cropH * scale)

  console.log(
    `  ${id}: content ${contentW}×${contentH}` +
    ` → crop ${cropW}×${cropH}` +
    ` → ${OUT_WIDTH}×${outHeight}`
  )

  // Extract cropped region
  const cropped = await sharp(srcPath)
    .ensureAlpha()
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .toBuffer()

  // Scale to OUT_WIDTH, preserving aspect ratio
  const scaled = await sharp(cropped)
    .resize(OUT_WIDTH, outHeight, { fit: 'fill' })
    .toBuffer()

  // Place on OUT_WIDTH × outHeight transparent canvas
  // Using 'fill' resize means no composite needed — scaled IS the final image
  const outDir  = path.join(OUT_ROOT, id)
  const outPath = path.join(outDir, `${id}-full.png`)
  fs.mkdirSync(outDir, { recursive: true })

  await sharp(scaled)
    .png({ compressionLevel: 8 })
    .toFile(outPath)

  // Verify the output
  const outMeta = await sharp(outPath).metadata()
  console.log(`  ✓  Written ${outPath} (${outMeta.width}×${outMeta.height})`)
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

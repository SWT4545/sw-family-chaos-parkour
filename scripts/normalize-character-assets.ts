/**
 * Normalize character PNG assets:
 *   - Detect real artwork bounds (flood-fill from edges to find background)
 *   - Crop away empty / white / transparent margins
 *   - Resize to standard canvas with safe padding, centered, contain fit
 *   - Output to public/game-assets/characters-normalized/
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

// ─── Target sizes ────────────────────────────────────────────────────────────

const TARGET: Record<string, [number, number]> = {
  card:    [512, 768],
  avatar:  [512, 512],
  full:    [768, 1024],
  icon:    [512, 512],
  victory: [1024, 576],
}

const SAFE_PADDING = 24   // px added on each side before resizing
const CHARACTERS   = ['commander', 'bj', 'brae', 'xanny']
const SRC_ROOT     = path.resolve('public/game-assets/characters')
const OUT_ROOT     = path.resolve('public/game-assets/characters-normalized')

// ─── Pixel helpers ───────────────────────────────────────────────────────────

function isEmpty(r: number, g: number, b: number, a: number): boolean {
  if (a < 12) return true                    // transparent
  if (r > 242 && g > 242 && b > 242) return true  // near-white
  return false
}

// Flood-fill from all four edges; everything reachable through empty pixels = background.
// Returns a Uint8Array where 1 = background, 0 = foreground.
function buildBackgroundMask(
  data: Buffer,
  width: number,
  height: number,
): Uint8Array {
  const bg    = new Uint8Array(width * height)
  const queue = new Int32Array(width * height * 2) // over-allocated
  let   head  = 0
  let   tail  = 0

  function seed(idx: number) {
    const p = idx * 4
    if (bg[idx] === 0 && isEmpty(data[p], data[p + 1], data[p + 2], data[p + 3])) {
      bg[idx]       = 1
      queue[tail++] = idx
    }
  }

  // Seed all edge pixels
  for (let x = 0; x < width; x++) {
    seed(x)                             // top row
    seed((height - 1) * width + x)     // bottom row
  }
  for (let y = 1; y < height - 1; y++) {
    seed(y * width)                     // left col
    seed(y * width + width - 1)         // right col
  }

  // BFS
  while (head < tail) {
    const idx = queue[head++]
    const x   = idx % width
    const y   = Math.floor(idx / width)

    const neighbors = [
      x > 0         ? idx - 1         : -1,
      x < width - 1 ? idx + 1         : -1,
      y > 0         ? idx - width     : -1,
      y < height - 1? idx + width     : -1,
    ]

    for (const n of neighbors) {
      if (n === -1 || bg[n] === 1) continue
      const p = n * 4
      if (isEmpty(data[p], data[p + 1], data[p + 2], data[p + 3])) {
        bg[n]         = 1
        queue[tail++] = n
      }
    }
  }

  return bg
}

// ─── Bounding box ────────────────────────────────────────────────────────────

interface BBox { left: number; top: number; right: number; bottom: number }

function findBBox(bg: Uint8Array, data: Buffer, width: number, height: number): BBox | null {
  let left   = width
  let top    = height
  let right  = 0
  let bottom = 0
  let found  = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (bg[idx] === 0 && data[idx * 4 + 3] > 10) {
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

// ─── Process one image ───────────────────────────────────────────────────────

async function processImage(
  inputPath: string,
  outputPath: string,
  slotName: string,
): Promise<void> {
  const [targetW, targetH] = TARGET[slotName]

  // Load as raw RGBA
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info

  const bg   = buildBackgroundMask(data, width, height)
  const bbox = findBBox(bg, data, width, height)

  if (!bbox) {
    console.warn(`  ⚠  No artwork detected in ${path.basename(inputPath)} — copying as-is`)
    const [tw, th] = [targetW, targetH]
    await sharp(inputPath)
      .resize(tw, th, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath)
    return
  }

  // Expand bbox by safe padding, clamped to image bounds
  const cropLeft   = Math.max(0, bbox.left   - SAFE_PADDING)
  const cropTop    = Math.max(0, bbox.top    - SAFE_PADDING)
  const cropRight  = Math.min(width  - 1, bbox.right  + SAFE_PADDING)
  const cropBottom = Math.min(height - 1, bbox.bottom + SAFE_PADDING)
  const cropW      = cropRight  - cropLeft + 1
  const cropH      = cropBottom - cropTop  + 1

  console.log(
    `  ${path.basename(inputPath)}: artwork ${bbox.right - bbox.left + 1}×${bbox.bottom - bbox.top + 1}` +
    ` → crop ${cropW}×${cropH} → ${targetW}×${targetH}`
  )

  // 1. Extract the cropped region
  const cropped = await sharp(inputPath)
    .ensureAlpha()
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .toBuffer()

  // 2. Resize to fit *inside* target (contain, no distortion)
  const resized = await sharp(cropped)
    .resize(targetW, targetH, {
      fit:    'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  // 3. Place centered on a transparent target-sized canvas
  await sharp({
    create: {
      width:      targetW,
      height:     targetH,
      channels:   4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(outputPath)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Normalizing character assets…\n')

  for (const char of CHARACTERS) {
    const srcDir = path.join(SRC_ROOT, char)
    const outDir = path.join(OUT_ROOT, char)
    fs.mkdirSync(outDir, { recursive: true })

    console.log(`── ${char}`)

    for (const slot of Object.keys(TARGET)) {
      const filename  = `${char}-${slot}.png`
      const inputPath = path.join(srcDir, filename)
      const outPath   = path.join(outDir, filename)

      if (!fs.existsSync(inputPath)) {
        console.warn(`  ⚠  Missing: ${inputPath}`)
        continue
      }

      try {
        await processImage(inputPath, outPath, slot)
      } catch (err) {
        console.error(`  ✗  Error processing ${filename}:`, err)
      }
    }

    console.log()
  }

  console.log('Done. Normalized assets written to public/game-assets/characters-normalized/')
}

main().catch((e) => { console.error(e); process.exit(1) })

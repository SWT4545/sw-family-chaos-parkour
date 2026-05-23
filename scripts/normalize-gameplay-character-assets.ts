/**
 * Gameplay-specific character asset normalizer — 6-pass background removal.
 *
 * Pass 1 — Edge BFS: flood-fill from all image edges through near-white/transparent
 *           pixels to mark the outer white background.
 * Pass 2 — Gap fill: flood-fill from every transparent pixel into adjacent near-white
 *           pixels to remove internal open gaps (spaces between arms, legs, body).
 * Pass 3 — Erosion: iteratively remove near-white pixels whose entire 8-neighbor
 *           window contains no clearly colored pixel. Runs until stable.
 * Pass 4 — Blob elimination: label all remaining white connected components; any
 *           component ≥ BLOB_THRESHOLD pixels is background — mark it transparent.
 *           (Large blobs = enclosed background regions; small blobs = character art.)
 * Pass 5 — Re-flood from newly freed transparent: removes adjacent near-white
 *           pixels now reachable after blob removal.
 * Pass 6 — Re-erode: another erosion round to clean up any fringe pixels exposed
 *           by passes 4-5.
 *
 * Output: foot-aligned transparent PNG at OUT_WIDTH px wide.
 * Feet sit 4px from the bottom edge — pivot-at-bottom rendering lands on ground.
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const SRC_ROOT  = path.resolve('public/game-assets/characters-normalized')
const OUT_ROOT  = path.resolve('public/game-assets/characters-gameplay')
const CHARS     = ['commander', 'bj', 'brae', 'xanny']

const OUT_WIDTH      = 500   // fixed output canvas width
const SIDE_PAD       = 12    // px left+right of content bbox
const TOP_PAD        = 20    // px above head
const FOOT_PAD       = 4     // px below feet
const BLOB_THRESHOLD = 200   // white blobs ≥ this many px are background

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isWhitePx(data: Buffer, i: number): boolean {
  const a = data[i*4+3]
  if (a < 10) return false   // transparent — not white, just gone
  return data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230
}

function isNearWhiteOrTransparent(data: Buffer, i: number): boolean {
  const a = data[i*4+3]
  if (a < 10) return true
  return data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230
}

function isColoredFg(data: Buffer, bg: Uint8Array, i: number): boolean {
  if (bg[i] === 1) return false
  const a = data[i*4+3]
  if (a < 10) return false
  return !(data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230)
}

// ─── Pass 1 + 2: edge BFS then flood from transparent ───────────────────────

function floodFromEdges(data: Buffer, bg: Uint8Array, W: number, H: number): void {
  const total = W * H
  // Use a JS array as queue — avoids fixed Int32Array overflow
  const queue: number[] = []

  function enqueue(i: number) {
    if (bg[i] || !isNearWhiteOrTransparent(data, i)) return
    bg[i] = 1; queue.push(i)
  }

  for (let x = 0; x < W; x++) { enqueue(x); enqueue((H-1)*W+x) }
  for (let y = 1; y < H-1; y++) { enqueue(y*W); enqueue(y*W+W-1) }

  let head = 0
  while (head < queue.length) {
    const i = queue[head++]
    const x = i%W, y = Math.floor(i/W)
    if (x > 0)   enqueue(i-1)
    if (x < W-1) enqueue(i+1)
    if (y > 0)   enqueue(i-W)
    if (y < H-1) enqueue(i+W)
  }
  void total
}

function floodFromTransparent(data: Buffer, bg: Uint8Array, W: number, H: number): void {
  const queue: number[] = []
  for (let i = 0; i < W*H; i++) {
    if (bg[i] === 1) queue.push(i)
  }
  let head = 0
  while (head < queue.length) {
    const i = queue[head++]
    const x = i%W, y = Math.floor(i/W)
    for (const n of [i-1, i+1, i-W, i+W]) {
      if (n < 0 || n >= W*H) continue
      if (bg[n] === 1) continue
      const nx = n%W
      if (Math.abs(nx - x) > 1) continue   // wrap guard
      if (isNearWhiteOrTransparent(data, n)) { bg[n]=1; queue.push(n) }
    }
  }
}

// ─── Pass 3 / 6: erosion of isolated white pixels ───────────────────────────

function erodeIsolatedWhite(data: Buffer, bg: Uint8Array, W: number, H: number): void {
  let changed = true
  while (changed) {
    changed = false
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y*W+x
        if (bg[i] || !isWhitePx(data, i)) continue
        let hasColored = false
        outer: for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const nx=x+dx, ny=y+dy
            if (nx<0||nx>=W||ny<0||ny>=H) continue
            if (isColoredFg(data, bg, ny*W+nx)) { hasColored=true; break outer }
          }
        }
        if (!hasColored) { bg[i]=1; changed=true }
      }
    }
  }
}

// ─── Pass 4: blob-size filtering ─────────────────────────────────────────────

function removeLargeWhiteBlobs(data: Buffer, bg: Uint8Array, W: number, H: number): number {
  const total = W*H
  const label = new Int32Array(total).fill(-1)
  const sizes: number[] = []
  let nextLbl = 0

  for (let i = 0; i < total; i++) {
    if (bg[i] || label[i] >= 0 || !isWhitePx(data, i)) continue
    const lbl = nextLbl++
    sizes.push(0)
    const q = [i]; label[i] = lbl; let head = 0
    while (head < q.length) {
      const ci = q[head++]; sizes[lbl]++
      const cx=ci%W, cy=Math.floor(ci/W)
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
        const nx=cx+dx, ny=cy+dy
        if (nx<0||nx>=W||ny<0||ny>=H) continue
        const ni=ny*W+nx
        if (bg[ni]||label[ni]>=0||!isWhitePx(data,ni)) continue
        label[ni]=lbl; q.push(ni)
      }
    }
  }

  let removed = 0
  for (let i = 0; i < total; i++) {
    const lbl = label[i]
    if (lbl >= 0 && sizes[lbl] >= BLOB_THRESHOLD) { bg[i]=1; removed++ }
  }

  const kept   = sizes.filter(s=>s< BLOB_THRESHOLD).length
  const killed = sizes.filter(s=>s>=BLOB_THRESHOLD).length
  console.log(`    Pass 4 blobs: ${sizes.length} total, removed ${killed} (≥${BLOB_THRESHOLD}px), kept ${kept} (<${BLOB_THRESHOLD}px), ${removed}px cleared`)
  return removed
}

// ─── Bounding box ─────────────────────────────────────────────────────────────

interface BBox { left:number; top:number; right:number; bottom:number }

function fgBBox(data: Buffer, bg: Uint8Array, W: number, H: number): BBox|null {
  let l=W,t=H,r=0,b=0,found=false
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const i=y*W+x
    if (!bg[i] && data[i*4+3]>8) {
      if(x<l)l=x; if(x>r)r=x; if(y<t)t=y; if(y>b)b=y; found=true
    }
  }
  return found ? {left:l,top:t,right:r,bottom:b} : null
}

// ─── Process one character ────────────────────────────────────────────────────

async function processCharacter(id: string): Promise<void> {
  const srcPath = path.join(SRC_ROOT, id, `${id}-full.png`)
  if (!fs.existsSync(srcPath)) { console.warn(`  ⚠  Missing ${srcPath}`); return }

  const { data, info } = await sharp(srcPath)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const bg = new Uint8Array(W*H)

  // Pass 1 — edge BFS
  floodFromEdges(data, bg, W, H)
  // Pass 2 — flood from transparent into near-white gaps
  floodFromTransparent(data, bg, W, H)
  // Pass 3 — erode isolated white
  erodeIsolatedWhite(data, bg, W, H)
  // Pass 4 — remove large white blobs
  removeLargeWhiteBlobs(data, bg, W, H)
  // Pass 5 — re-flood: newly freed transparent pixels may unlock more near-white
  floodFromTransparent(data, bg, W, H)
  // Pass 6 — final erosion to clean fringe pixels
  erodeIsolatedWhite(data, bg, W, H)

  const bbox = fgBBox(data, bg, W, H)
  if (!bbox) { console.warn(`  ⚠  No foreground in ${id}`); return }

  let bgPx = 0; for (let i=0;i<bg.length;i++) if(bg[i])bgPx++
  let whitePx = 0
  for (let i=0;i<W*H;i++) if(!bg[i]&&isWhitePx(data,i)) whitePx++
  console.log(`  ${id}: ${bgPx} bg removed (${(bgPx/(W*H)*100).toFixed(1)}%), ${whitePx} white kept (${(whitePx/(W*H)*100).toFixed(1)}%)`)

  // Apply mask — zero alpha on all background pixels
  const cleaned = Buffer.from(data)
  for (let i=0;i<W*H;i++) if(bg[i]) cleaned[i*4+3]=0

  // Crop: feet at bottom, tight on sides, small top pad
  const cL = Math.max(0,           bbox.left  - SIDE_PAD)
  const cT = Math.max(0,           bbox.top   - TOP_PAD)
  const cR = Math.min(W-1,         bbox.right + SIDE_PAD)
  const cB = Math.min(H-1,         bbox.bottom+ FOOT_PAD)
  const cW = cR-cL+1, cH = cB-cT+1
  const outH = Math.round(cH * OUT_WIDTH / cW)
  console.log(`  → crop ${cW}×${cH} → ${OUT_WIDTH}×${outH}`)

  const cleanedPng = await sharp(cleaned, { raw:{width:W,height:H,channels:4} }).png().toBuffer()
  const cropped    = await sharp(cleanedPng).extract({left:cL,top:cT,width:cW,height:cH}).toBuffer()

  const outDir  = path.join(OUT_ROOT, id)
  const outPath = path.join(outDir, `${id}-full.png`)
  fs.mkdirSync(outDir, {recursive:true})

  await sharp(cropped).resize(OUT_WIDTH, outH, {fit:'fill'}).png({compressionLevel:8}).toFile(outPath)
  console.log(`  ✓  ${outPath} (${OUT_WIDTH}×${outH})`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Normalizing gameplay assets — 6-pass background removal…\n')
  fs.mkdirSync(OUT_ROOT, {recursive:true})
  for (const id of CHARS) {
    console.log(`── ${id}`)
    try { await processCharacter(id) } catch(e) { console.error(`  ✗ ${id}:`,e) }
    console.log()
  }
  console.log('Done → public/game-assets/characters-gameplay/')
}

main().catch(e=>{ console.error(e); process.exit(1) })

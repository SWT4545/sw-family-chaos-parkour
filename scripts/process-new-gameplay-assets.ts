/**
 * Process new gameplay character PNGs.
 * Runs 6-pass background removal, tight bbox crop, resize to OUT_WIDTH.
 * BJ already has transparent bg — passes run harmlessly.
 */
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const OUT_WIDTH = 500
const SIDE_PAD  = 8
const TOP_PAD   = 16
const FOOT_PAD  = 4
const BLOB_THRESHOLD = 200

const SOURCES: { src: string; id: string }[] = [
  { src: 'public/Commander-gameplay.png', id: 'commander' },
  { src: 'public/BJ-gameplay.png',        id: 'bj'        },
  { src: 'public/Brae-gameplay.png',      id: 'brae'      },
  { src: 'public/Xanny-gameplay.png',     id: 'xanny'     },
]

function isNearWhiteOrTransparent(data: Buffer, i: number): boolean {
  const a = data[i*4+3]; if (a < 10) return true
  return data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230
}
function isWhitePx(data: Buffer, i: number): boolean {
  const a = data[i*4+3]; if (a < 10) return false
  return data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230
}
function isColoredFg(data: Buffer, bg: Uint8Array, i: number): boolean {
  if (bg[i]) return false
  const a = data[i*4+3]; if (a < 10) return false
  return !(data[i*4] > 230 && data[i*4+1] > 230 && data[i*4+2] > 230)
}

function floodFromEdges(data: Buffer, bg: Uint8Array, W: number, H: number) {
  const q: number[] = []
  const enq = (i: number) => { if (!bg[i] && isNearWhiteOrTransparent(data,i)) { bg[i]=1; q.push(i) } }
  for (let x=0;x<W;x++) { enq(x); enq((H-1)*W+x) }
  for (let y=1;y<H-1;y++) { enq(y*W); enq(y*W+W-1) }
  let h=0
  while (h<q.length) {
    const i=q[h++]; const x=i%W,y=Math.floor(i/W)
    if(x>0)enq(i-1); if(x<W-1)enq(i+1); if(y>0)enq(i-W); if(y<H-1)enq(i+W)
  }
}
function floodFromTransparent(data: Buffer, bg: Uint8Array, W: number, H: number) {
  const q: number[] = []
  for (let i=0;i<W*H;i++) if(bg[i])q.push(i)
  let h=0
  while(h<q.length) {
    const i=q[h++]; const x=i%W,y=Math.floor(i/W)
    for(const n of [i-1,i+1,i-W,i+W]) {
      if(n<0||n>=W*H||bg[n])continue
      if(Math.abs(n%W-x)>1)continue
      if(isNearWhiteOrTransparent(data,n)){bg[n]=1;q.push(n)}
    }
  }
}
function erodeIsolatedWhite(data: Buffer, bg: Uint8Array, W: number, H: number) {
  let changed=true
  while(changed) {
    changed=false
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
      const i=y*W+x; if(bg[i]||!isWhitePx(data,i))continue
      let hasColored=false
      outer: for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        if(!dx&&!dy)continue
        const nx=x+dx,ny=y+dy
        if(nx<0||nx>=W||ny<0||ny>=H)continue
        if(isColoredFg(data,bg,ny*W+nx)){hasColored=true;break outer}
      }
      if(!hasColored){bg[i]=1;changed=true}
    }
  }
}
function removeLargeWhiteBlobs(data: Buffer, bg: Uint8Array, W: number, H: number) {
  const total=W*H; const label=new Int32Array(total).fill(-1); const sizes: number[]=[]
  let next=0
  for(let i=0;i<total;i++) {
    if(bg[i]||label[i]>=0||!isWhitePx(data,i))continue
    const lbl=next++; sizes.push(0); const q=[i]; label[i]=lbl; let h=0
    while(h<q.length){
      const ci=q[h++]; sizes[lbl]++; const cx=ci%W,cy=Math.floor(ci/W)
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]] as const){
        const nx=cx+dx,ny=cy+dy; if(nx<0||nx>=W||ny<0||ny>=H)continue
        const ni=ny*W+nx; if(bg[ni]||label[ni]>=0||!isWhitePx(data,ni))continue
        label[ni]=lbl; q.push(ni)
      }
    }
  }
  let removed=0
  for(let i=0;i<total;i++){const l=label[i];if(l>=0&&sizes[l]>=BLOB_THRESHOLD){bg[i]=1;removed++}}
  const killed=sizes.filter(s=>s>=BLOB_THRESHOLD).length
  console.log(`    blobs: ${sizes.length} total, removed ${killed} (≥${BLOB_THRESHOLD}px), ${removed}px cleared`)
}

async function process(src: string, id: string) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const bg = new Uint8Array(W*H)

  floodFromEdges(data, bg, W, H)
  floodFromTransparent(data, bg, W, H)
  erodeIsolatedWhite(data, bg, W, H)
  removeLargeWhiteBlobs(data, bg, W, H)
  floodFromTransparent(data, bg, W, H)
  erodeIsolatedWhite(data, bg, W, H)

  // Apply mask
  const cleaned = Buffer.from(data)
  for (let i=0;i<W*H;i++) if(bg[i]) cleaned[i*4+3]=0

  // Bbox on cleaned data
  let l=W,t=H,r=0,b=0,found=false
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x; if(!bg[i]&&cleaned[i*4+3]>8){
      if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;found=true
    }
  }
  if(!found){console.warn(`  ⚠  No content in ${id}`);return null}

  let whitePx=0; for(let i=0;i<W*H;i++) if(!bg[i]&&isWhitePx(cleaned,i)) whitePx++
  console.log(`  ${id}: ${whitePx} white kept (${(whitePx/(W*H)*100).toFixed(2)}%), bbox ${l},${t}→${r},${b}`)

  const cL=Math.max(0,l-SIDE_PAD), cT=Math.max(0,t-TOP_PAD)
  const cR=Math.min(W-1,r+SIDE_PAD), cB=Math.min(H-1,b+FOOT_PAD)
  const cW=cR-cL+1, cH=cB-cT+1
  const outH=Math.round(cH*OUT_WIDTH/cW)
  console.log(`  → crop ${cW}×${cH} → ${OUT_WIDTH}×${outH}  ratio ${(OUT_WIDTH/outH).toFixed(3)}`)

  const cleanedPng = await sharp(cleaned, {raw:{width:W,height:H,channels:4}}).png().toBuffer()

  const outDir  = path.resolve(`public/game-assets/characters-gameplay/${id}`)
  const outPath = path.join(outDir, `${id}-full.png`)
  fs.mkdirSync(outDir, {recursive:true})

  await sharp(cleanedPng)
    .extract({left:cL,top:cT,width:cW,height:cH})
    .resize(OUT_WIDTH, outH, {fit:'fill'})
    .png({compressionLevel:8})
    .toFile(outPath)

  console.log(`  ✓  ${outPath} (${OUT_WIDTH}×${outH})`)
  return { id, outW: OUT_WIDTH, outH }
}

async function main() {
  console.log('Processing new gameplay assets (6-pass)…\n')
  const results = []
  for (const { src, id } of SOURCES) {
    console.log(`── ${id}`)
    try { const r = await process(src, id); if(r) results.push(r) }
    catch(e) { console.error(`  ✗ ${id}:`, e) }
    console.log()
  }
  console.log('CHAR_SIZES:')
  for (const r of results) {
    const ratio = (r.outW/r.outH).toFixed(3)
    const h = Math.round(r.outW / parseFloat(ratio))
    const wTarget = [125,130,140,150,160,166,169,170]
    const best = wTarget.reduce((a,b)=>Math.abs(b/r.outH*r.outW-b)<Math.abs(a/r.outH*r.outW-a)?b:a)
    console.log(`  ${r.id}: { w: ${best}, h: ${Math.round(best*r.outH/r.outW)} },  // ${r.outW}×${r.outH} ratio ${ratio}`)
  }
}
main().catch(e=>{console.error(e);process.exit(1)})

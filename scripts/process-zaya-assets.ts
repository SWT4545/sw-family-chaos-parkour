import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const BLOB_THRESHOLD = 200

function isNWT(d:Buffer,i:number){const a=d[i*4+3];if(a<10)return true;return d[i*4]>220&&d[i*4+1]>220&&d[i*4+2]>220}
function isWh(d:Buffer,i:number){const a=d[i*4+3];if(a<10)return false;return d[i*4]>220&&d[i*4+1]>220&&d[i*4+2]>220}
function isFg(d:Buffer,bg:Uint8Array,i:number){if(bg[i])return false;const a=d[i*4+3];if(a<10)return false;return !(d[i*4]>220&&d[i*4+1]>220&&d[i*4+2]>220)}
function flood1(d:Buffer,bg:Uint8Array,W:number,H:number){const q:number[]=[],e=(i:number)=>{if(!bg[i]&&isNWT(d,i)){bg[i]=1;q.push(i)}};for(let x=0;x<W;x++){e(x);e((H-1)*W+x)}for(let y=1;y<H-1;y++){e(y*W);e(y*W+W-1)}let h=0;while(h<q.length){const i=q[h++],x=i%W,y=Math.floor(i/W);if(x>0)e(i-1);if(x<W-1)e(i+1);if(y>0)e(i-W);if(y<H-1)e(i+W)}}
function flood2(d:Buffer,bg:Uint8Array,W:number,H:number){const q:number[]=[];for(let i=0;i<W*H;i++)if(bg[i])q.push(i);let h=0;while(h<q.length){const i=q[h++],x=i%W,y=Math.floor(i/W);for(const n of[i-1,i+1,i-W,i+W]){if(n<0||n>=W*H||bg[n])continue;if(Math.abs(n%W-x)>1)continue;if(isNWT(d,n)){bg[n]=1;q.push(n)}}}}
function erode(d:Buffer,bg:Uint8Array,W:number,H:number){let ch=true;while(ch){ch=false;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(bg[i]||!isWh(d,i))continue;let hc=false;outer:for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;if(isFg(d,bg,ny*W+nx)){hc=true;break outer}}if(!hc){bg[i]=1;ch=true}}}}
function blobs(d:Buffer,bg:Uint8Array,W:number,H:number){const tot=W*H,lbl=new Int32Array(tot).fill(-1),sz:number[]=[];let nx=0;for(let i=0;i<tot;i++){if(bg[i]||lbl[i]>=0||!isWh(d,i))continue;const l=nx++;sz.push(0);const q=[i];lbl[i]=l;let h=0;while(h<q.length){const ci=q[h++];sz[l]++;const cx=ci%W,cy=Math.floor(ci/W);for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]] as const){const nx2=cx+dx,ny=cy+dy;if(nx2<0||nx2>=W||ny<0||ny>=H)continue;const ni=ny*W+nx2;if(bg[ni]||lbl[ni]>=0||!isWh(d,ni))continue;lbl[ni]=l;q.push(ni)}}}let rm=0;for(let i=0;i<tot;i++){const l=lbl[i];if(l>=0&&sz[l]>=BLOB_THRESHOLD){bg[i]=1;rm++}}console.log(`  blobs: ${sz.length}, removed ${sz.filter(s=>s>=BLOB_THRESHOLD).length}, cleared ${rm}px`)}

async function processImg(src:string, outDir:string, outName:string, outW:number, sidePad:number, topPad:number, footPad:number) {
  const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const {width:W,height:H}=info
  const bg=new Uint8Array(W*H)
  flood1(data,bg,W,H);flood2(data,bg,W,H);erode(data,bg,W,H);blobs(data,bg,W,H);flood2(data,bg,W,H);erode(data,bg,W,H)
  const clean=Buffer.from(data)
  for(let i=0;i<W*H;i++)if(bg[i])clean[i*4+3]=0
  let l=W,t=H,r=0,b=0,found=false
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!bg[i]&&clean[i*4+3]>8){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;found=true}}
  if(!found){console.warn('No content');return null}
  let wp=0;for(let i=0;i<W*H;i++)if(!bg[i]&&isWh(clean,i))wp++
  const cL=Math.max(0,l-sidePad),cT=Math.max(0,t-topPad),cR=Math.min(W-1,r+sidePad),cB=Math.min(H-1,b+footPad)
  const cW=cR-cL+1,cH=cB-cT+1,outH=Math.round(cH*outW/cW)
  console.log(`  ${(wp/(W*H)*100).toFixed(2)}% white | crop ${cW}×${cH} → ${outW}×${outH} (ratio ${(outW/outH).toFixed(3)})`)
  const png=await sharp(clean,{raw:{width:W,height:H,channels:4}}).png().toBuffer()
  fs.mkdirSync(outDir,{recursive:true})
  await sharp(png).extract({left:cL,top:cT,width:cW,height:cH}).resize(outW,outH,{fit:'fill'}).png({compressionLevel:8}).toFile(path.join(outDir,outName))
  console.log(`  ✓  ${path.join(outDir,outName)} (${outW}×${outH})`)
  return {outW,outH}
}

async function main() {
  console.log('Processing Zaya assets…\n')
  console.log('── gameplay')
  const gp = await processImg('public/Zaya-gameplay.png','public/game-assets/characters-gameplay/zaya','zaya-full.png',500,10,18,4)
  console.log('\n── celeb')
  const cb = await processImg('public/Zaya-celeb.png','public/game-assets/characters-victory/zaya','zaya-celeb.png',600,10,18,6)
  console.log('\nDone.')
  if(gp) console.log(`gameplay: ${gp.outW}×${gp.outH}  ratio=${( gp.outW/gp.outH).toFixed(3)}`)
  if(cb) console.log(`celeb:    ${cb.outW}×${cb.outH}  ratio=${(cb.outW/cb.outH).toFixed(3)}`)
}
main().catch(e=>{console.error(e);process.exit(1)})

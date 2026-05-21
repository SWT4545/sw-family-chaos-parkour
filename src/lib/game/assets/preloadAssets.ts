import { CHARACTERS_LIST } from '@/lib/game/characters/CharacterRegistry'

const COVER = '/family-chaos-poster.png'

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()   // non-fatal — game falls back to color fill
    img.src = src
  })
}

let preloaded = false

export async function preloadGameAssets(): Promise<void> {
  if (preloaded || typeof window === 'undefined') return
  preloaded = true

  const srcs: string[] = [COVER]
  for (const char of CHARACTERS_LIST) {
    srcs.push(
      char.assets.card,
      char.assets.avatar,
      char.assets.full,
      char.assets.icon,
      char.assets.victory,
    )
  }

  await Promise.all(srcs.map(loadImage))
}

// Synchronous cache for canvas — returns a loaded HTMLImageElement or null
const imgCache = new Map<string, HTMLImageElement>()

export function getCachedImage(src: string): HTMLImageElement | null {
  if (imgCache.has(src)) return imgCache.get(src)!

  const img = new Image()
  img.onload = () => imgCache.set(src, img)
  img.onerror = () => {}
  img.src = src

  return null   // caller uses color fallback until ready
}

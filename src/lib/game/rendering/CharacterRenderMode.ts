export type CharacterRenderMode = 'png2d' | 'threePrimitive' | 'gltf3dFuture'

const STORAGE_KEY = 'sw-character-render-mode'
const DEFAULT: CharacterRenderMode = 'png2d'

export function getRenderMode(): CharacterRenderMode {
  if (typeof window === 'undefined') return DEFAULT
  const v = localStorage.getItem(STORAGE_KEY) as CharacterRenderMode | null
  if (v === 'png2d' || v === 'threePrimitive' || v === 'gltf3dFuture') return v
  return DEFAULT
}

export function setRenderMode(mode: CharacterRenderMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, mode)
}

export const RENDER_MODE_LABELS: Record<CharacterRenderMode, string> = {
  png2d:           'PNG 2D',
  threePrimitive:  '3D Primitive (Experimental)',
  gltf3dFuture:    '3D GLTF (Future)',
}

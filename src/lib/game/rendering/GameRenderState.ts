// Written by GameCanvas each frame; read by ThreeCharacterLayer.
// Using a MutableRefObject avoids React state overhead.

export interface PlayerRenderState {
  x:            number    // world-space body center
  y:            number
  vx:           number
  vy:           number
  grounded:     boolean
  facing:       1 | -1
  anim:         number
  landSquashT:  number
  characterId:  string
  color:        string
  name:         string
  effectType:   string | null
  effectEndsAt: number
}

export interface GameRenderState {
  p1:        PlayerRenderState | null
  p2:        PlayerRenderState | null
  camX:      number   // canvas-space scroll offset (before zoom)
  camY:      number
  zoom:      number
  canvasW:   number
  canvasH:   number
  timestamp: number
}

export function defaultGameRenderState(): GameRenderState {
  return { p1: null, p2: null, camX: 0, camY: 0, zoom: 1.5, canvasW: 960, canvasH: 540, timestamp: 0 }
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
}

export interface CheckpointDef {
  id: number
  x: number
  y: number
}

export interface MapDef {
  width: number
  height: number
  startPositions: Array<{ x: number; y: number }>
  finishX: number
  finishY: number
  platforms: Platform[]
  checkpoints: CheckpointDef[]
}

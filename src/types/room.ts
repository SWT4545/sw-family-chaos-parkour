export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'finished'
export type RoomMode   = 'family' | '1v1'

export interface Room {
  code:       string
  hostId:     string
  status:     RoomStatus
  mapId:      string
  mode:       RoomMode
  maxPlayers: number
  createdAt:  number
}

export interface RoomPlayer {
  id:          string
  displayName: string
  characterId: string
  ready:       boolean
  isHost:      boolean
  connected:   boolean
  joinedAt:    number
}

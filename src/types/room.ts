export type RoomStatus = 'waiting' | 'countdown' | 'playing' | 'finishing' | 'results'
export type RoomMode   = 'family' | '1v1'

export interface RaceResult {
  playerId:     string
  displayName:  string
  characterId:  string
  finishTimeMs: number   // ms from GO moment; -1 = DNF
  coins:        number
  place:        number   // 1-based
  dnf:          boolean
}

export interface Room {
  code:              string
  hostId:            string
  status:            RoomStatus
  mapId:             string              // legacy field kept for compat
  selectedLevelId?:  string              // WorldLevelDef id
  selectedWorldId?:  string             // WorldDef id
  mode:              RoomMode
  maxPlayers:        number
  createdAt:         number
  countdownStartAt?: number             // ms timestamp — GO = countdownStartAt + 3000
  raceResults?:      RaceResult[]       // written by host when status = 'results'
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

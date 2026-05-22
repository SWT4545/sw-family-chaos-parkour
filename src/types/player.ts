import type { CharacterAssets, MovementStats } from '@/lib/game/characters/CharacterRegistry'

export type CharacterId = 'commander' | 'bj' | 'brae' | 'xanny'
export type GameMode   = 'solo' | '1v1' | 'online'
export type GameScreen =
  | 'main-menu'
  | 'mode-select'
  | 'character-select'
  | 'level-select'
  | 'lobby'
  | 'online-gateway'
  | 'online-create'
  | 'online-join'
  | 'online-lobby'
  | 'game'
  | 'victory'
  | 'solo-victory'
  | 'leaderboard'
  | 'daily-challenges'

export interface Character {
  id:           CharacterId
  name:         string
  role:         string
  tagline:      string
  ability:      string
  abilityDesc:  string
  color:        string
  assets:       CharacterAssets
  movementStats: MovementStats
}

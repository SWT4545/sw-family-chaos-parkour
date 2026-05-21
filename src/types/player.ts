import type { CharacterAssets, MovementStats } from '@/lib/game/characters/CharacterRegistry'

export type CharacterId = 'commander' | 'bj' | 'brae' | 'xanny'
export type GameScreen = 'main-menu' | 'character-select' | 'lobby' | 'game' | 'victory'

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

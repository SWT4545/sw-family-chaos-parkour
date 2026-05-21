import { CHARACTERS_LIST } from './CharacterRegistry'
import type { Character } from '@/types/player'

export const CHARACTERS: Character[] = CHARACTERS_LIST.map((entry) => ({
  id:           entry.id,
  name:         entry.displayName,
  role:         entry.role,
  tagline:      entry.tagline,
  ability:      entry.abilityName,
  abilityDesc:  entry.abilityDescription,
  color:        entry.primaryColor,
  assets:       entry.assets,
  movementStats: entry.movementStats,
}))

export type CosmeticType    = 'trail' | 'victoryPose' | 'emote' | 'border' | 'badge'
export type CosmeticRarity  = 'common' | 'rare' | 'epic' | 'legendary'
export type UnlockSource    = 'default' | 'coins' | 'season'

export interface Cosmetic {
  id:          string
  name:        string
  type:        CosmeticType
  rarity:      CosmeticRarity
  cost:        number        // coins; 0 = free
  description: string
  icon:        string        // emoji
  unlockedBy:  UnlockSource
  seasonLevel?: number       // required season level when unlockedBy === 'season'
}

export interface CosmeticInventory {
  ownedIds:           string[]
  equippedTrail:      string | null
  equippedVictoryPose: string | null
  equippedBorder:     string | null
  equippedEmote:      string | null
}

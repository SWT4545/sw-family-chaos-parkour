export type ShopItemType =
  | 'characterSkin' | 'trail' | 'border' | 'emote'
  | 'victoryPose' | 'badge' | 'musicTrack' | 'powerupStyle'
  | 'nameplate'

export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type UnlockRequirement =
  | { type: 'coins'; amount: number }
  | { type: 'level'; level: number }
  | { type: 'wins'; count: number }
  | { type: 'worldComplete'; worldId: string }
  | { type: 'default' }

export interface ShopItem {
  id:                   string
  name:                 string
  description:          string
  type:                 ShopItemType
  rarity:               ShopRarity
  priceCoins:           number
  icon:                 string          // emoji or path
  assetPath?:           string
  previewAssetPath?:    string
  characterRestriction?: string         // only for that character
  unlockRequirement:    UnlockRequirement
  isActive:             boolean
  isSeasonal?:          boolean
  createdAt:            number
}

export interface PurchaseResult {
  success:   boolean
  reason?:   'insufficient_coins' | 'already_owned' | 'locked' | 'not_found'
  newBalance?: number
}

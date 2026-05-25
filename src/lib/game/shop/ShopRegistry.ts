import type { ShopItem } from './ShopTypes'

const now = Date.now()

export const SHOP_ITEMS: ShopItem[] = [
  // ── Trails ─────────────────────────────────────────────────────────────────
  {
    id: 'trail_default',   name: 'No Trail',     description: 'Clean run, no trail',
    type: 'trail', rarity: 'common', priceCoins: 0, icon: '💨',
    unlockRequirement: { type: 'default' }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_lightning', name: 'Lightning',    description: 'Electric streak behind you',
    type: 'trail', rarity: 'rare', priceCoins: 150, icon: '⚡',
    unlockRequirement: { type: 'coins', amount: 150 }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_fire',      name: 'Fire',          description: 'Blazing fire trail',
    type: 'trail', rarity: 'epic', priceCoins: 300, icon: '🔥',
    unlockRequirement: { type: 'coins', amount: 300 }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_taco',      name: 'Taco Trail',    description: 'Leave taco chaos behind',
    type: 'trail', rarity: 'legendary', priceCoins: 500, icon: '🌮',
    unlockRequirement: { type: 'coins', amount: 500 }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_slime',     name: 'Slime Trail',   description: 'Slippery slime streak',
    type: 'trail', rarity: 'rare', priceCoins: 200, icon: '🟢',
    unlockRequirement: { type: 'coins', amount: 200 }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_star',      name: 'Stardust',      description: 'Glittering stardust',
    type: 'trail', rarity: 'epic', priceCoins: 350, icon: '⭐',
    unlockRequirement: { type: 'coins', amount: 350 }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_neon',      name: 'Neon Glow',     description: 'Tokyo neon streak',
    type: 'trail', rarity: 'epic', priceCoins: 400, icon: '🌸',
    unlockRequirement: { type: 'worldComplete', worldId: 'world4' }, isActive: true, createdAt: now,
  },
  {
    id: 'trail_lava',      name: 'Lava Flow',     description: 'Hot molten streak',
    type: 'trail', rarity: 'legendary', priceCoins: 550, icon: '🌋',
    unlockRequirement: { type: 'worldComplete', worldId: 'world3' }, isActive: true, createdAt: now,
  },

  // ── Borders ─────────────────────────────────────────────────────────────────
  {
    id: 'border_default',  name: 'No Border',     description: 'Plain character frame',
    type: 'border', rarity: 'common', priceCoins: 0, icon: '⬜',
    unlockRequirement: { type: 'default' }, isActive: true, createdAt: now,
  },
  {
    id: 'border_gold',     name: 'Gold Frame',    description: 'Golden character border',
    type: 'border', rarity: 'rare', priceCoins: 100, icon: '🏅',
    unlockRequirement: { type: 'coins', amount: 100 }, isActive: true, createdAt: now,
  },
  {
    id: 'border_fire',     name: 'Flame Border',  description: 'Fiery character frame',
    type: 'border', rarity: 'epic', priceCoins: 250, icon: '🔥',
    unlockRequirement: { type: 'coins', amount: 250 }, isActive: true, createdAt: now,
  },
  {
    id: 'border_chaos',    name: 'Chaos Border',  description: 'Season 1 exclusive border',
    type: 'border', rarity: 'legendary', priceCoins: 0, icon: '🌟',
    unlockRequirement: { type: 'level', level: 10 }, isActive: true, isSeasonal: true, createdAt: now,
  },
  {
    id: 'border_neon',     name: 'Neon Pulse',    description: 'Pulsing neon frame',
    type: 'border', rarity: 'epic', priceCoins: 300, icon: '💜',
    unlockRequirement: { type: 'coins', amount: 300 }, isActive: true, createdAt: now,
  },
  {
    id: 'border_volcano',  name: 'Lava Ring',     description: 'Molten border from Volcano world',
    type: 'border', rarity: 'legendary', priceCoins: 450, icon: '🌋',
    unlockRequirement: { type: 'worldComplete', worldId: 'world3' }, isActive: true, createdAt: now,
  },

  // ── Victory Poses ───────────────────────────────────────────────────────────
  {
    id: 'pose_default',    name: 'Classic Win',   description: 'The classic winner pose',
    type: 'victoryPose', rarity: 'common', priceCoins: 0, icon: '🏆',
    unlockRequirement: { type: 'default' }, isActive: true, createdAt: now,
  },
  {
    id: 'pose_dance',      name: 'Victory Dance', description: 'Dance it out, champ',
    type: 'victoryPose', rarity: 'rare', priceCoins: 200, icon: '💃',
    unlockRequirement: { type: 'coins', amount: 200 }, isActive: true, createdAt: now,
  },
  {
    id: 'pose_flex',       name: 'Flex',          description: 'Show those gains',
    type: 'victoryPose', rarity: 'epic', priceCoins: 350, icon: '💪',
    unlockRequirement: { type: 'coins', amount: 350 }, isActive: true, createdAt: now,
  },
  {
    id: 'pose_taco',       name: 'Taco Salute',   description: 'Ultimate taco celebration',
    type: 'victoryPose', rarity: 'legendary', priceCoins: 600, icon: '🌮',
    unlockRequirement: { type: 'coins', amount: 600 }, isActive: true, createdAt: now,
  },
  {
    id: 'pose_chaos',      name: 'Chaos King',    description: 'Reign of chaos',
    type: 'victoryPose', rarity: 'legendary', priceCoins: 0, icon: '👑',
    unlockRequirement: { type: 'worldComplete', worldId: 'world6' }, isActive: true, createdAt: now,
  },

  // ── Emotes ──────────────────────────────────────────────────────────────────
  {
    id: 'emote_gg',        name: 'GG',            description: 'Good game!',
    type: 'emote', rarity: 'common', priceCoins: 0, icon: '🤝',
    unlockRequirement: { type: 'default' }, isActive: true, createdAt: now,
  },
  {
    id: 'emote_taco',      name: 'Taco Time',     description: 'Taco celebration',
    type: 'emote', rarity: 'rare', priceCoins: 100, icon: '🌮',
    unlockRequirement: { type: 'coins', amount: 100 }, isActive: true, createdAt: now,
  },
  {
    id: 'emote_chaos',     name: 'Pure Chaos',    description: 'Embrace the chaos',
    type: 'emote', rarity: 'epic', priceCoins: 200, icon: '😈',
    unlockRequirement: { type: 'coins', amount: 200 }, isActive: true, createdAt: now,
  },
  {
    id: 'emote_sleeping',  name: 'Too Easy',      description: 'Was that it?',
    type: 'emote', rarity: 'rare', priceCoins: 150, icon: '😴',
    unlockRequirement: { type: 'coins', amount: 150 }, isActive: true, createdAt: now,
  },
  {
    id: 'emote_crown',     name: 'Crown Drop',    description: 'Drop that crown',
    type: 'emote', rarity: 'epic', priceCoins: 250, icon: '👑',
    unlockRequirement: { type: 'wins', count: 10 }, isActive: true, createdAt: now,
  },

  // ── Badges ──────────────────────────────────────────────────────────────────
  {
    id: 'badge_founder',   name: 'S1 Founder',    description: 'Played Season 1',
    type: 'badge', rarity: 'legendary', priceCoins: 0, icon: '🎖️',
    unlockRequirement: { type: 'level', level: 1 }, isActive: true, isSeasonal: true, createdAt: now,
  },
  {
    id: 'badge_s1champ',   name: 'S1 Champion',   description: 'Reached Season 1 max level',
    type: 'badge', rarity: 'legendary', priceCoins: 0, icon: '👑',
    unlockRequirement: { type: 'level', level: 30 }, isActive: true, isSeasonal: true, createdAt: now,
  },
  {
    id: 'badge_w1',        name: 'City Runner',   description: 'Completed Family City',
    type: 'badge', rarity: 'rare', priceCoins: 0, icon: '🏙️',
    unlockRequirement: { type: 'worldComplete', worldId: 'world1' }, isActive: true, createdAt: now,
  },
  {
    id: 'badge_w2',        name: 'Lab Survivor',  description: 'Survived Chaos Labs',
    type: 'badge', rarity: 'epic', priceCoins: 0, icon: '🧪',
    unlockRequirement: { type: 'worldComplete', worldId: 'world2' }, isActive: true, createdAt: now,
  },
  {
    id: 'badge_chaos_champ', name: 'Chaos Champion', description: 'Completed all 6 worlds',
    type: 'badge', rarity: 'legendary', priceCoins: 0, icon: '🌀',
    unlockRequirement: { type: 'worldComplete', worldId: 'world6' }, isActive: true, createdAt: now,
  },

  // ── Nameplates ──────────────────────────────────────────────────────────────
  {
    id: 'plate_default',   name: 'Default',       description: 'Plain nameplate',
    type: 'nameplate', rarity: 'common', priceCoins: 0, icon: '📋',
    unlockRequirement: { type: 'default' }, isActive: true, createdAt: now,
  },
  {
    id: 'plate_gold',      name: 'Gold',          description: 'Golden nameplate',
    type: 'nameplate', rarity: 'rare', priceCoins: 175, icon: '✨',
    unlockRequirement: { type: 'coins', amount: 175 }, isActive: true, createdAt: now,
  },
  {
    id: 'plate_chaos',     name: 'Chaos',         description: 'The chaos nameplate',
    type: 'nameplate', rarity: 'epic', priceCoins: 400, icon: '💥',
    unlockRequirement: { type: 'coins', amount: 400 }, isActive: true, createdAt: now,
  },
]

export const SHOP_BY_ID = new Map(SHOP_ITEMS.map(i => [i.id, i]))

export function getShopItemsByType(type: ShopItem['type']): ShopItem[] {
  return SHOP_ITEMS.filter(i => i.isActive && i.type === type)
}

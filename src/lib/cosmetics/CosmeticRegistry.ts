import type { Cosmetic } from '@/types/cosmetics'

export const ALL_COSMETICS: Cosmetic[] = [
  // ── Trails ─────────────────────────────────────────────────────
  { id: 'trail_default',   name: 'No Trail',      type: 'trail', rarity: 'common',    cost: 0,   icon: '💨', description: 'Clean run, no trail',        unlockedBy: 'default' },
  { id: 'trail_lightning', name: 'Lightning',      type: 'trail', rarity: 'rare',      cost: 150, icon: '⚡', description: 'Electric streak behind you',  unlockedBy: 'coins' },
  { id: 'trail_fire',      name: 'Fire',           type: 'trail', rarity: 'epic',      cost: 300, icon: '🔥', description: 'Blazing fire trail',           unlockedBy: 'coins' },
  { id: 'trail_taco',      name: 'Taco Trail',     type: 'trail', rarity: 'legendary', cost: 500, icon: '🌮', description: 'Leave taco chaos behind',      unlockedBy: 'coins' },
  { id: 'trail_slime',     name: 'Slime Trail',    type: 'trail', rarity: 'rare',      cost: 200, icon: '🟢', description: 'Slippery slime streak',        unlockedBy: 'coins' },
  { id: 'trail_star',      name: 'Stardust',       type: 'trail', rarity: 'epic',      cost: 350, icon: '⭐', description: 'Glittering stardust',          unlockedBy: 'coins' },

  // ── Borders ────────────────────────────────────────────────────
  { id: 'border_default',  name: 'No Border',      type: 'border', rarity: 'common',    cost: 0,   icon: '⬜', description: 'Plain character frame',       unlockedBy: 'default' },
  { id: 'border_gold',     name: 'Gold Frame',     type: 'border', rarity: 'rare',      cost: 100, icon: '🏅', description: 'Golden character border',      unlockedBy: 'coins' },
  { id: 'border_fire',     name: 'Flame Border',   type: 'border', rarity: 'epic',      cost: 250, icon: '🔥', description: 'Fiery character frame',        unlockedBy: 'coins' },
  { id: 'border_chaos',    name: 'Chaos Border',   type: 'border', rarity: 'legendary', cost: 0,   icon: '🌟', description: 'Season 1 exclusive border',    unlockedBy: 'season', seasonLevel: 10 },

  // ── Victory Poses ──────────────────────────────────────────────
  { id: 'pose_default',    name: 'Classic Win',    type: 'victoryPose', rarity: 'common',    cost: 0,   icon: '🏆', description: 'The classic winner pose',   unlockedBy: 'default' },
  { id: 'pose_dance',      name: 'Victory Dance',  type: 'victoryPose', rarity: 'rare',      cost: 200, icon: '💃', description: 'Dance it out, champ',       unlockedBy: 'coins' },
  { id: 'pose_flex',       name: 'Flex',           type: 'victoryPose', rarity: 'epic',      cost: 350, icon: '💪', description: 'Show those gains',          unlockedBy: 'coins' },
  { id: 'pose_taco',       name: 'Taco Salute',    type: 'victoryPose', rarity: 'legendary', cost: 600, icon: '🌮', description: 'Ultimate taco celebration', unlockedBy: 'coins' },

  // ── Emotes ────────────────────────────────────────────────────
  { id: 'emote_gg',        name: 'GG',             type: 'emote', rarity: 'common',    cost: 0,   icon: '🤝', description: 'Good game!',                  unlockedBy: 'default' },
  { id: 'emote_taco',      name: 'Taco Time',      type: 'emote', rarity: 'rare',      cost: 100, icon: '🌮', description: 'Taco celebration',             unlockedBy: 'coins' },
  { id: 'emote_chaos',     name: 'Pure Chaos',     type: 'emote', rarity: 'epic',      cost: 200, icon: '😈', description: 'Embrace the chaos',            unlockedBy: 'coins' },
  { id: 'emote_sleeping',  name: 'Too Easy',       type: 'emote', rarity: 'rare',      cost: 150, icon: '😴', description: 'Was that it?',                 unlockedBy: 'coins' },

  // ── Badges ────────────────────────────────────────────────────
  { id: 'badge_founder',   name: 'S1 Founder',     type: 'badge', rarity: 'legendary', cost: 0,   icon: '🎖️', description: 'Played Season 1',            unlockedBy: 'season', seasonLevel: 1 },
  { id: 'badge_s1champ',   name: 'S1 Champion',    type: 'badge', rarity: 'legendary', cost: 0,   icon: '👑', description: 'Reached Season 1 max level', unlockedBy: 'season', seasonLevel: 30 },
]

export const COSMETICS_BY_ID = new Map(ALL_COSMETICS.map(c => [c.id, c]))

export function getCosmeticsByType(type: Cosmetic['type']): Cosmetic[] {
  return ALL_COSMETICS.filter(c => c.type === type)
}

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 }
export function sortByRarity(cosmetics: Cosmetic[]): Cosmetic[] {
  return [...cosmetics].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
}

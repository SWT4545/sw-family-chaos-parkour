import type { CosmeticInventory } from '@/types/cosmetics'
import { COSMETICS_BY_ID } from './CosmeticRegistry'

const STORAGE_KEY = 'swfcp-cosmetics'

const DEFAULT_INVENTORY: CosmeticInventory = {
  ownedIds:           ['trail_default', 'border_default', 'pose_default', 'emote_gg', 'badge_founder'],
  equippedTrail:      'trail_default',
  equippedVictoryPose: 'pose_default',
  equippedBorder:     'border_default',
  equippedEmote:      'emote_gg',
}

function load(): CosmeticInventory {
  if (typeof window === 'undefined') return DEFAULT_INVENTORY
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_INVENTORY, ...JSON.parse(raw) } : { ...DEFAULT_INVENTORY }
  } catch { return { ...DEFAULT_INVENTORY } }
}

function save(inv: CosmeticInventory): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inv)) } catch {}
}

export const CosmeticInventoryManager = {
  get(): CosmeticInventory { return load() },

  owns(id: string): boolean { return load().ownedIds.includes(id) },

  purchase(id: string, coinBalance: number): { success: boolean; newBalance: number } {
    const cosmetic = COSMETICS_BY_ID.get(id)
    if (!cosmetic || cosmetic.cost > coinBalance) return { success: false, newBalance: coinBalance }
    const inv = load()
    if (inv.ownedIds.includes(id)) return { success: false, newBalance: coinBalance }
    inv.ownedIds.push(id)
    save(inv)
    return { success: true, newBalance: coinBalance - cosmetic.cost }
  },

  unlock(id: string): void {
    const inv = load()
    if (!inv.ownedIds.includes(id)) {
      inv.ownedIds.push(id)
      save(inv)
    }
  },

  equip(id: string): void {
    const cosmetic = COSMETICS_BY_ID.get(id)
    if (!cosmetic) return
    const inv = load()
    if (!inv.ownedIds.includes(id)) return
    switch (cosmetic.type) {
      case 'trail':       inv.equippedTrail      = id; break
      case 'victoryPose': inv.equippedVictoryPose = id; break
      case 'border':      inv.equippedBorder     = id; break
      case 'emote':       inv.equippedEmote      = id; break
    }
    save(inv)
  },

  merge(remote: Partial<CosmeticInventory>): void {
    const inv = load()
    const merged = { ...inv, ...remote, ownedIds: [...new Set([...inv.ownedIds, ...(remote.ownedIds ?? [])])] }
    save(merged)
  },
}

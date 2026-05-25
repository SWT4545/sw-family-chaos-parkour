import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import type { EquippedCosmetics } from '@/lib/game/profile/ProfileTypes'

export const InventoryService = {
  // ── Get all owned cosmetic IDs ──
  getOwned(playerId: string): string[] {
    const p = PlayerProfileService.getCurrent()
    if (!p || p.playerId !== playerId) return []
    return p.ownedCosmetics
  },

  // ── Get equipped cosmetics ──
  getEquipped(playerId: string): EquippedCosmetics | null {
    const p = PlayerProfileService.getCurrent()
    if (!p || p.playerId !== playerId) return null
    return p.equippedCosmetics
  },

  // ── Equip a cosmetic into its slot ──
  async equip(playerId: string, itemId: string): Promise<boolean> {
    const p = PlayerProfileService.getCurrent()
    if (!p || p.playerId !== playerId) return false
    if (!p.ownedCosmetics.includes(itemId)) return false

    // Determine slot from the shop registry
    const { SHOP_BY_ID } = await import('./ShopRegistry')
    const item = SHOP_BY_ID.get(itemId)
    if (!item) return false

    const slotMap: Record<string, keyof EquippedCosmetics> = {
      trail:       'trail',
      border:      'border',
      emote:       'emote',
      victoryPose: 'victoryPose',
      badge:       'badge',
      musicTrack:  'musicTrack',
      nameplate:   'nameplate',
    }
    const slot = slotMap[item.type]
    if (!slot) return false

    await PlayerProfileService.equipCosmetic(playerId, slot, itemId)
    return true
  },

  // ── Check character restriction ──
  canEquip(itemId: string, characterId: string): boolean {
    // For now no character restrictions enforced — all items are universal
    return true
  },
}

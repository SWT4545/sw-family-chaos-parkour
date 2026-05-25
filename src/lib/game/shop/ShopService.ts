import { PlayerProfileService } from '@/lib/game/profile/PlayerProfileService'
import { SHOP_BY_ID } from './ShopRegistry'
import type { PurchaseResult, ShopItem } from './ShopTypes'

export const ShopService = {
  // ── Buy an item with coins ──
  async purchase(playerId: string, itemId: string): Promise<PurchaseResult> {
    const item = SHOP_BY_ID.get(itemId)
    if (!item) return { success: false, reason: 'not_found' }
    if (!item.isActive) return { success: false, reason: 'not_found' }

    const profile = PlayerProfileService.getCurrent()
    if (!profile || profile.playerId !== playerId) return { success: false, reason: 'not_found' }

    // Already owned
    if (profile.ownedCosmetics.includes(itemId) || profile.ownedMusicTracks.includes(itemId)) {
      return { success: false, reason: 'already_owned', newBalance: profile.coins }
    }

    // Check lock requirement
    const lockCheck = checkUnlockRequirement(item, profile)
    if (!lockCheck.passed) return { success: false, reason: 'locked' }

    // Check coin balance
    if (profile.coins < item.priceCoins) {
      return { success: false, reason: 'insufficient_coins', newBalance: profile.coins }
    }

    // Deduct coins
    const spent = await PlayerProfileService.spendCoins(playerId, item.priceCoins)
    if (!spent) return { success: false, reason: 'insufficient_coins', newBalance: profile.coins }

    // Add to inventory
    if (item.type === 'musicTrack') {
      await PlayerProfileService.addMusicTrack(playerId, itemId)
    } else {
      await PlayerProfileService.addCosmetic(playerId, itemId)
    }

    const updated = PlayerProfileService.getCurrent()
    return { success: true, newBalance: updated?.coins ?? 0 }
  },

  // ── Check if player meets unlock requirement ──
  isUnlocked(itemId: string, playerId: string): boolean {
    const item    = SHOP_BY_ID.get(itemId)
    const profile = PlayerProfileService.getCurrent()
    if (!item || !profile || profile.playerId !== playerId) return false
    return checkUnlockRequirement(item, profile).passed
  },

  // ── Check if player owns an item ──
  isOwned(itemId: string, playerId: string): boolean {
    const profile = PlayerProfileService.getCurrent()
    if (!profile || profile.playerId !== playerId) return false
    return profile.ownedCosmetics.includes(itemId) || profile.ownedMusicTracks.includes(itemId)
  },

  // ── Auto-grant default items on first load ──
  async grantDefaults(playerId: string): Promise<void> {
    const profile = PlayerProfileService.getCurrent()
    if (!profile || profile.playerId !== playerId) return
    const defaults = ['trail_default', 'border_default', 'pose_default', 'emote_gg', 'plate_default']
    let changed = false
    for (const id of defaults) {
      if (!profile.ownedCosmetics.includes(id)) {
        profile.ownedCosmetics.push(id)
        changed = true
      }
    }
    if (changed) await PlayerProfileService.save(profile)
  },
}

function checkUnlockRequirement(item: ShopItem, profile: { level: number; wins: number; completedWorlds: string[] }) {
  const req = item.unlockRequirement
  switch (req.type) {
    case 'default': return { passed: true }
    case 'coins':   return { passed: true }  // just need coins to buy
    case 'level':   return { passed: profile.level >= req.level }
    case 'wins':    return { passed: profile.wins >= req.count }
    case 'worldComplete': return { passed: profile.completedWorlds.includes(req.worldId) }
    default:        return { passed: true }
  }
}

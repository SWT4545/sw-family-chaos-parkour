const KEY = 'swfcp_zaya_unlocked'

export const ZayaUnlock = {
  isUnlocked(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(KEY) === 'true'
  },
  unlock(): void {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, 'true')
  },
}

import { isFirebaseConfigured } from './firebaseConfig'
import { getApps } from 'firebase/app'

export interface RemoteConfigValues {
  coinMultiplier:           number
  dailyChallengeMultiplier: number
  tacoRainChance:           number
  weekendBonusActive:       boolean
  eventName:                string
  eventBannerColor:         string
  maintenanceMode:          boolean
}

const DEFAULTS: RemoteConfigValues = {
  coinMultiplier:           1.0,
  dailyChallengeMultiplier: 1.0,
  tacoRainChance:           0.15,
  weekendBonusActive:       false,
  eventName:                '',
  eventBannerColor:         '',
  maintenanceMode:          false,
}

export async function fetchRemoteConfig(): Promise<RemoteConfigValues> {
  if (!isFirebaseConfigured() || typeof window === 'undefined') return DEFAULTS
  const apps = getApps()
  const app = apps.length ? apps[0] : null
  if (!app) return DEFAULTS
  try {
    const { getRemoteConfig, fetchAndActivate, getValue } = await import('firebase/remote-config')
    const rc = getRemoteConfig(app)
    rc.settings.minimumFetchIntervalMillis = 3_600_000 // 1 hour
    rc.defaultConfig = DEFAULTS as unknown as Record<string, string>
    await fetchAndActivate(rc)
    return {
      coinMultiplier:           Number(getValue(rc, 'coinMultiplier').asNumber()),
      dailyChallengeMultiplier: Number(getValue(rc, 'dailyChallengeMultiplier').asNumber()),
      tacoRainChance:           Number(getValue(rc, 'tacoRainChance').asNumber()),
      weekendBonusActive:       getValue(rc, 'weekendBonusActive').asBoolean(),
      eventName:                getValue(rc, 'eventName').asString(),
      eventBannerColor:         getValue(rc, 'eventBannerColor').asString(),
      maintenanceMode:          getValue(rc, 'maintenanceMode').asBoolean(),
    }
  } catch { return DEFAULTS }
}

export { DEFAULTS as defaultRemoteConfig }

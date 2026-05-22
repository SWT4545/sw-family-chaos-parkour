const STORAGE_KEY = 'swc-audio-settings'

export interface AudioSettings {
  musicMuted:  boolean
  musicVolume: number   // 0–1
  sfxMuted:    boolean
  sfxVolume:   number   // 0–1
}

const DEFAULTS: AudioSettings = {
  musicMuted: false, musicVolume: 0.65,
  sfxMuted:   false, sfxVolume:   0.75,
}

let _settings: AudioSettings = { ...DEFAULTS }

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) _settings = { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {}
}

export function getAudioSettings(): AudioSettings {
  return _settings
}

export function updateAudioSettings(partial: Partial<AudioSettings>): void {
  _settings = { ..._settings, ...partial }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings)) } catch {}
}

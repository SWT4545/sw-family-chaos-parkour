export interface PlayerChaosState {
  trapName:     string
  trapIcon:     string
  cooldownPct:  number        // 0 = ready, 1 = just used (decreases to 0)
  effectLabel:  string | null // e.g. "SLIPPED!" "FROZEN!"
  effectColor:  string | null // accent hex for effect label
  effectPct:    number        // remaining fraction of effect (0-1)
}

export interface ChaosState {
  p1:             PlayerChaosState
  p2:             PlayerChaosState
  tacoRainActive: boolean
}

export function defaultChaosState(): ChaosState {
  const blank: PlayerChaosState = {
    trapName: '', trapIcon: '', cooldownPct: 0,
    effectLabel: null, effectColor: null, effectPct: 0,
  }
  return { p1: { ...blank }, p2: { ...blank }, tacoRainActive: false }
}

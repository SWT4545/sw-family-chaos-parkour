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
  p1Coins:        number
  p2Coins:        number
  // Campaign / solo fields (undefined when not in solo campaign mode)
  p1Lives?:       number   // current lives remaining
  p1Deaths?:      number   // deaths this run
  p1TrapHits?:    number   // trap hits this run
}

export function defaultChaosState(): ChaosState {
  const blank: PlayerChaosState = {
    trapName: '', trapIcon: '', cooldownPct: 0,
    effectLabel: null, effectColor: null, effectPct: 0,
  }
  return { p1: { ...blank }, p2: { ...blank }, tacoRainActive: false, p1Coins: 0, p2Coins: 0 }
}

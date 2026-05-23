// Per-character canonical visual config.
// PNG assets are the source of truth — Three.js primitives approximate these.

export interface CharacterVisualConfig {
  id:           string
  displayName:  string
  primaryColor: string
  accentColor:  string
  shoeColor:    string
  skinTone:     string
  // Three.js primitive palette
  three: {
    bodyColor:  number   // hex int
    shirtColor: number
    pantsColor: number
    shoeColor:  number
    skinColor:  number
    hairColor:  number
    accentHex:  number
  }
}

export const CHARACTER_VISUAL_CONFIG: Record<string, CharacterVisualConfig> = {
  commander: {
    id: 'commander', displayName: 'The Commander',
    primaryColor: '#dc2626', accentColor: '#fbbf24', shoeColor: '#1a1a1a', skinTone: '#8B5E3C',
    three: {
      bodyColor:  0x111111,  // black shirt
      shirtColor: 0x111111,
      pantsColor: 0x111111,
      shoeColor:  0xdc2626,  // red/black Jordan
      skinColor:  0x8B5E3C,
      hairColor:  0x1a1a1a,  // shaved / dark
      accentHex:  0xdc2626,  // red S&W patch
    },
  },
  bj: {
    id: 'bj', displayName: 'BJ',
    primaryColor: '#e11d48', accentColor: '#dc2626', shoeColor: '#1a1a1a', skinTone: '#4A2C14',
    three: {
      bodyColor:  0x1a1a1a,
      shirtColor: 0xdc2626,  // red/black hoodie
      pantsColor: 0x111111,
      shoeColor:  0xdc2626,
      skinColor:  0x4A2C14,
      hairColor:  0x1a1a1a,
      accentHex:  0xe11d48,  // chaos trigger orb
    },
  },
  brae: {
    id: 'brae', displayName: 'Brae',
    primaryColor: '#8b5cf6', accentColor: '#a78bfa', shoeColor: '#7c3aed', skinTone: '#5C3A1E',
    three: {
      bodyColor:  0x111111,  // black hoodie
      shirtColor: 0x111111,
      pantsColor: 0x222222,
      shoeColor:  0x7c3aed,  // purple shoes
      skinColor:  0x5C3A1E,
      hairColor:  0x1a1a1a,
      accentHex:  0x8b5cf6,  // purple phone
    },
  },
  xanny: {
    id: 'xanny', displayName: 'Xanny',
    primaryColor: '#06b6d4', accentColor: '#60a5fa', shoeColor: '#dc2626', skinTone: '#8B5E3C',
    three: {
      bodyColor:  0x1e40af,  // blue shirt
      shirtColor: 0x1e40af,
      pantsColor: 0x1e3a5f,  // blue jeans
      shoeColor:  0xdc2626,  // red/black Jordans
      skinColor:  0x8B5E3C,
      hairColor:  0x2d1b00,  // curly dark hair
      accentHex:  0x06b6d4,  // speed trail
    },
  },
  zaya: {
    id: 'zaya', displayName: 'Zaya',
    primaryColor: '#ec4899', accentColor: '#f9a8d4', shoeColor: '#14b8a6', skinTone: '#C68642',
    three: {
      bodyColor:  0x6b7280,  // gray sweatshirt
      shirtColor: 0x6b7280,
      pantsColor: 0xec4899,  // pink pants
      shoeColor:  0x14b8a6,  // teal shoes
      skinColor:  0xC68642,
      hairColor:  0x1a1a1a,  // black hair with blue bow
      accentHex:  0xec4899,  // pink gravity dash
    },
  },
  governor: {
    id: 'governor', displayName: 'Governor',
    primaryColor: '#22c55e', accentColor: '#4ade80', shoeColor: '#1a1a1a', skinTone: '#5C3A1E',
    three: {
      bodyColor:  0x1a1a1a,  // black hoodie
      shirtColor: 0x111111,
      pantsColor: 0x111111,
      shoeColor:  0x1a1a1a,
      skinColor:  0x5C3A1E,
      hairColor:  0x111111,  // cap
      accentHex:  0x22c55e,  // governor aura
    },
  },
}

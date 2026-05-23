import type { CharacterId } from '@/types/player'

export interface CharacterAssets {
  card:        string   // UI only — never use in gameplay rendering
  avatar:      string
  full:        string
  icon:        string
  victory:     string
  gameplayFull: string  // foot-aligned tight-crop; use in GameCanvas + renderers
}

export interface MovementStats {
  speed:                  number   // max horizontal velocity
  jump:                   number   // first-jump velocity magnitude
  acceleration:           number   // ground lerp factor
  specialAbilityCooldown: number   // seconds between ability uses (Phase 3)
}

export interface CharacterEntry {
  id:                 CharacterId
  displayName:        string
  role:               string
  tagline:            string
  primaryColor:       string
  abilityName:        string
  abilityDescription: string
  assets:             CharacterAssets
  movementStats:      MovementStats
}

const GAMEPLAY_ASSET_IDS = new Set(['commander', 'bj', 'brae', 'xanny'])

function assetPath(id: string) {
  const norm     = `/game-assets/characters-normalized/${id}`
  const gameplay = `/game-assets/characters-gameplay/${id}`
  const hasGameplay = GAMEPLAY_ASSET_IDS.has(id)
  return {
    card:         `${norm}/${id}-card.png`,
    avatar:       `${norm}/${id}-avatar.png`,
    full:         `${norm}/${id}-full.png`,
    icon:         `${norm}/${id}-icon.png`,
    victory:      `${norm}/${id}-victory.png`,
    gameplayFull: hasGameplay
      ? `${gameplay}/${id}-full.png`
      : `${norm}/${id}-full.png`,
  }
}

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterEntry> = {
  commander: {
    id:                 'commander',
    displayName:        'The Commander',
    role:               'Leader',
    tagline:            'The Plan. The Crew. The Legend.',
    primaryColor:       '#dc2626',
    abilityName:        'Command Boost',
    abilityDescription: 'Increases movement speed temporarily.',
    assets:             assetPath('commander'),
    movementStats: {
      speed:                  8.0,
      jump:                   17.0,
      acceleration:           0.27,
      specialAbilityCooldown: 8,
    },
  },

  bj: {
    id:                 'bj',
    displayName:        'BJ',
    role:               'Chaos Master',
    tagline:            'Set the Traps. Control the Chaos.',
    primaryColor:       '#e11d48',
    abilityName:        'Chaos Trigger',
    abilityDescription: 'Activates trap chaos — turns the course into pure mayhem.',
    assets:             assetPath('bj'),
    movementStats: {
      speed:                  8.5,
      jump:                   16.5,
      acceleration:           0.28,
      specialAbilityCooldown: 6,
    },
  },

  brae: {
    id:                 'brae',
    displayName:        'Brae',
    role:               'Trickster',
    tagline:            'Clever. Quick. Full of Tricks.',
    primaryColor:       '#8b5cf6',
    abilityName:        'Trick Shot',
    abilityDescription: 'Stuns or disrupts opponents — outsmarks everyone.',
    assets:             assetPath('brae'),
    movementStats: {
      speed:                  8.5,
      jump:                   18.0,
      acceleration:           0.30,
      specialAbilityCooldown: 7,
    },
  },

  xanny: {
    id:                 'xanny',
    displayName:        'Xanny',
    role:               'Speedster',
    tagline:            'Fast. Smooth. Unstoppable.',
    primaryColor:       '#06b6d4',
    abilityName:        'Turbo Dash',
    abilityDescription: 'Short burst of extreme speed — never slows down.',
    assets:             assetPath('xanny'),
    movementStats: {
      speed:                  10.5,
      jump:                   15.5,
      acceleration:           0.35,
      specialAbilityCooldown: 5,
    },
  },
}

export const CHARACTERS_LIST: CharacterEntry[] = Object.values(CHARACTER_REGISTRY)

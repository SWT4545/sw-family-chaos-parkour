import type { LevelDef } from '@/types/game'
import { ROOFTOP_TEST } from './rooftopTest'

export const LEVEL_1: LevelDef = {
  id: 'rooftop', name: 'Training Grounds', subtitle: 'City Rooftops at Sunset',
  difficulty: 'easy', difficultyNum: 1,
  description: 'Learn the basics. Jump, dodge, and make it to the finish!',
  unlockReward: 'BJ unlocked',
  map: ROOFTOP_TEST,
}

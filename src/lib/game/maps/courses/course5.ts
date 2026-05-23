import type { CourseDef, MapDef } from '@/types/game'

const VOLCANO_ESCAPE: MapDef = {
  id: 'volcano-escape',
  name: 'Volcano Escape',
  width: 4400,
  height: 720,
  background: 'volcano',
  startPositions: [
    { x: 80, y: 580 },
    { x: 140, y: 580 },
  ],
  finishX: 4200,
  finishY: 240,
  platforms: [
    { x: 0,    y: 620, width: 240, height: 20, type: 'solid' },
    { x: 280,  y: 580, width: 120, height: 20, type: 'solid' },
    { x: 440,  y: 540, width: 100, height: 20, type: 'solid' },
    { x: 580,  y: 490, width: 100, height: 20, type: 'solid' },
    { x: 720,  y: 440, width: 90,  height: 20, type: 'solid' },
    // Lava rock platforms — narrow and dangerous
    { x: 860,  y: 390, width: 80,  height: 20, type: 'solid' },
    { x: 990,  y: 340, width: 80,  height: 20, type: 'solid' },
    { x: 1120, y: 290, width: 80,  height: 20, type: 'solid' },
    { x: 1250, y: 340, width: 80,  height: 20, type: 'solid' },
    { x: 1380, y: 290, width: 80,  height: 20, type: 'solid' },
    // Floating ash platforms
    { x: 1520, y: 330, width: 90,  height: 20, type: 'solid' },
    { x: 1660, y: 280, width: 90,  height: 20, type: 'solid' },
    { x: 1800, y: 330, width: 90,  height: 20, type: 'solid' },
    { x: 1940, y: 280, width: 80,  height: 20, type: 'solid' },
    { x: 2080, y: 240, width: 80,  height: 20, type: 'solid' },
    // Volcano crater edge
    { x: 2220, y: 280, width: 120, height: 20, type: 'solid' },
    { x: 2380, y: 240, width: 120, height: 20, type: 'solid' },
    { x: 2540, y: 280, width: 100, height: 20, type: 'solid' },
    { x: 2680, y: 240, width: 100, height: 20, type: 'solid' },
    { x: 2820, y: 280, width: 100, height: 20, type: 'solid' },
    // Summit sprint
    { x: 2960, y: 240, width: 90,  height: 20, type: 'solid' },
    { x: 3100, y: 200, width: 90,  height: 20, type: 'solid' },
    { x: 3240, y: 240, width: 80,  height: 20, type: 'solid' },
    { x: 3370, y: 200, width: 80,  height: 20, type: 'solid' },
    { x: 3500, y: 240, width: 80,  height: 20, type: 'solid' },
    { x: 3630, y: 220, width: 420, height: 20, type: 'solid' },
  ],
  checkpoints: [
    { x: 1150, y: 270 },
    { x: 2400, y: 220 },
  ],
  coinPositions: [
    { x: 320, y: 550 }, { x: 620, y: 460 }, { x: 900, y: 360 },
    { x: 1030, y: 310 }, { x: 1160, y: 260 }, { x: 1560, y: 300 },
    { x: 1700, y: 250 }, { x: 1840, y: 300 }, { x: 2120, y: 210 },
    { x: 2420, y: 210 }, { x: 2700, y: 210 }, { x: 3140, y: 170 },
  ],
  soloHazards: [
    { x: 380,  y: 560, trapId: 'slime_puddle' },
    { x: 660,  y: 510, trapId: 'bear_trap' },
    { x: 810,  y: 460, trapId: 'slime_puddle' },
    { x: 1070, y: 360, trapId: 'bear_trap' },
    { x: 1420, y: 310, trapId: 'slime_puddle' },
    { x: 1750, y: 300, trapId: 'bear_trap' },
    { x: 2170, y: 260, trapId: 'slime_puddle' },
    { x: 2480, y: 260, trapId: 'bear_trap' },
    { x: 2760, y: 260, trapId: 'slime_puddle' },
    { x: 3050, y: 220, trapId: 'bear_trap' },
  ],
}

export const COURSE_5: CourseDef = {
  id: 'volcano-escape',
  courseNumber: 5,
  name: 'Volcano Escape',
  subtitle: 'Outrun the eruption',
  theme: 'Active volcano summit',
  description: 'The volcano is erupting. Leap across lava rocks, avoid eruption blasts, and reach the summit before it all comes down.',
  map: VOLCANO_ESCAPE,
}

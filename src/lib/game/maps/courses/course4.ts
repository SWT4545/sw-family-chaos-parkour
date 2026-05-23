import type { CourseDef, MapDef } from '@/types/game'

const JAPAN_NEON_RUN: MapDef = {
  id: 'japan-neon-run',
  name: 'Japan Neon Run',
  width: 4400,
  height: 720,
  background: 'neon',
  startPositions: [
    { x: 80, y: 580 },
    { x: 140, y: 580 },
  ],
  finishX: 4200,
  finishY: 280,
  platforms: [
    { x: 0,    y: 620, width: 240, height: 20, type: 'solid' },
    { x: 280,  y: 580, width: 140, height: 20, type: 'solid' },
    { x: 460,  y: 540, width: 120, height: 20, type: 'solid' },
    { x: 620,  y: 500, width: 120, height: 20, type: 'solid' },
    { x: 780,  y: 460, width: 120, height: 20, type: 'solid' },
    // Neon sign platforms
    { x: 940,  y: 410, width: 100, height: 20, type: 'solid' },
    { x: 1080, y: 360, width: 100, height: 20, type: 'solid' },
    { x: 1220, y: 310, width: 100, height: 20, type: 'solid' },
    { x: 1360, y: 360, width: 100, height: 20, type: 'solid' },
    { x: 1500, y: 310, width: 100, height: 20, type: 'solid' },
    // Zigzag section
    { x: 1660, y: 360, width: 90,  height: 20, type: 'solid' },
    { x: 1800, y: 310, width: 90,  height: 20, type: 'solid' },
    { x: 1940, y: 360, width: 90,  height: 20, type: 'solid' },
    { x: 2080, y: 310, width: 90,  height: 20, type: 'solid' },
    { x: 2220, y: 270, width: 90,  height: 20, type: 'solid' },
    // Temple section
    { x: 2360, y: 310, width: 160, height: 20, type: 'solid' },
    { x: 2560, y: 270, width: 140, height: 20, type: 'solid' },
    { x: 2740, y: 230, width: 140, height: 20, type: 'solid' },
    { x: 2920, y: 270, width: 120, height: 20, type: 'solid' },
    // Final sprint — narrow precision
    { x: 3080, y: 240, width: 100, height: 20, type: 'solid' },
    { x: 3220, y: 280, width: 90,  height: 20, type: 'solid' },
    { x: 3360, y: 240, width: 90,  height: 20, type: 'solid' },
    { x: 3500, y: 280, width: 90,  height: 20, type: 'solid' },
    { x: 3640, y: 240, width: 100, height: 20, type: 'solid' },
    { x: 3780, y: 260, width: 380, height: 20, type: 'solid' },
  ],
  checkpoints: [
    { x: 1250, y: 290 },
    { x: 2760, y: 210 },
  ],
  coinPositions: [
    { x: 320, y: 550 }, { x: 500, y: 510 }, { x: 820, y: 430 },
    { x: 980, y: 380 }, { x: 1120, y: 330 }, { x: 1260, y: 280 },
    { x: 1540, y: 280 }, { x: 1840, y: 280 }, { x: 2120, y: 280 },
    { x: 2600, y: 240 }, { x: 2780, y: 200 }, { x: 3680, y: 210 },
  ],
  soloHazards: [
    { x: 420,  y: 560, trapId: 'bear_trap' },
    { x: 870,  y: 480, trapId: 'bear_trap' },
    { x: 1460, y: 330, trapId: 'bear_trap' },
    { x: 1750, y: 330, trapId: 'bear_trap' },
    { x: 2300, y: 290, trapId: 'bear_trap' },
    { x: 2860, y: 250, trapId: 'bear_trap' },
    { x: 3170, y: 260, trapId: 'bear_trap' },
    { x: 3450, y: 260, trapId: 'bear_trap' },
  ],
}

export const COURSE_4: CourseDef = {
  id: 'japan-neon-run',
  courseNumber: 4,
  name: 'Japan Neon Run',
  subtitle: 'Precision in the neon night',
  theme: 'Tokyo neon cityscape',
  description: 'Dash through neon-lit platforms and temple rooftops in the Tokyo night. Precision is everything.',
  map: JAPAN_NEON_RUN,
}

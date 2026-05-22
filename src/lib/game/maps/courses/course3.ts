import type { CourseDef, MapDef } from '@/types/game'

const CITY_HEIGHTS: MapDef = {
  id: 'city-heights',
  name: 'City Heights',
  width: 4400,
  height: 720,
  background: 'city',
  startPositions: [
    { x: 80, y: 580 },
    { x: 140, y: 580 },
  ],
  finishX: 4200,
  finishY: 250,
  platforms: [
    { x: 0,    y: 620, width: 260, height: 20, type: 'solid' },
    { x: 300,  y: 580, width: 180, height: 20, type: 'solid' },
    { x: 520,  y: 540, width: 160, height: 20, type: 'solid' },
    { x: 720,  y: 490, width: 140, height: 20, type: 'solid' },
    { x: 900,  y: 440, width: 160, height: 20, type: 'solid' },
    // Building tops
    { x: 1100, y: 380, width: 200, height: 20, type: 'solid' },
    { x: 1340, y: 320, width: 180, height: 20, type: 'solid' },
    { x: 1560, y: 360, width: 160, height: 20, type: 'solid' },
    { x: 1760, y: 300, width: 180, height: 20, type: 'solid' },
    { x: 1980, y: 340, width: 160, height: 20, type: 'solid' },
    // Narrow city ledges
    { x: 2180, y: 280, width: 100, height: 20, type: 'solid' },
    { x: 2320, y: 240, width: 100, height: 20, type: 'solid' },
    { x: 2460, y: 280, width: 100, height: 20, type: 'solid' },
    { x: 2600, y: 240, width: 100, height: 20, type: 'solid' },
    { x: 2740, y: 280, width: 100, height: 20, type: 'solid' },
    // Skyscraper section
    { x: 2880, y: 320, width: 180, height: 20, type: 'solid' },
    { x: 3100, y: 270, width: 160, height: 20, type: 'solid' },
    { x: 3300, y: 230, width: 160, height: 20, type: 'solid' },
    { x: 3500, y: 270, width: 140, height: 20, type: 'solid' },
    { x: 3680, y: 230, width: 160, height: 20, type: 'solid' },
    { x: 3880, y: 250, width: 380, height: 20, type: 'solid' },
  ],
  checkpoints: [
    { x: 1200, y: 360 },
    { x: 2600, y: 220 },
  ],
  coinPositions: [
    { x: 360, y: 550 }, { x: 580, y: 510 }, { x: 760, y: 460 },
    { x: 960, y: 410 }, { x: 1180, y: 350 }, { x: 1400, y: 290 },
    { x: 1800, y: 270 }, { x: 2220, y: 250 }, { x: 2640, y: 210 },
    { x: 2920, y: 290 }, { x: 3340, y: 200 }, { x: 3720, y: 200 },
  ],
  soloHazards: [
    { x: 660,  y: 560, type: 'spike' },
    { x: 1050, y: 460, type: 'spike' },
    { x: 1500, y: 340, type: 'spike' },
    { x: 2100, y: 300, type: 'spike' },
    { x: 2850, y: 300, type: 'spike' },
    { x: 3440, y: 250, type: 'spike' },
    { x: 3820, y: 250, type: 'spike' },
  ],
}

export const COURSE_3: CourseDef = {
  id: 'city-heights',
  courseNumber: 3,
  name: 'City Heights',
  subtitle: 'The skyline is yours',
  theme: 'City rooftops and skyscrapers',
  description: 'Leap between skyscrapers hundreds of feet above the city streets. One missed jump and it\'s over.',
  map: CITY_HEIGHTS,
}

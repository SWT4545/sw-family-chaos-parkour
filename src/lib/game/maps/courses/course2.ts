import type { CourseDef, MapDef } from '@/types/game'

const SCHOOL_DASH: MapDef = {
  id: 'school-dash',
  name: 'School Dash',
  width: 4400,
  height: 720,
  background: 'school',
  startPositions: [
    { x: 80, y: 580 },
    { x: 140, y: 580 },
  ],
  finishX: 4200,
  finishY: 300,
  platforms: [
    // Ground sections
    { x: 0,    y: 620, width: 300, height: 20, type: 'solid' },
    { x: 340,  y: 600, width: 200, height: 20, type: 'solid' },
    { x: 580,  y: 570, width: 160, height: 20, type: 'solid' },
    { x: 780,  y: 540, width: 140, height: 20, type: 'solid' },
    // Classroom windows section
    { x: 960,  y: 500, width: 180, height: 20, type: 'solid' },
    { x: 1180, y: 460, width: 160, height: 20, type: 'solid' },
    { x: 1380, y: 420, width: 140, height: 20, type: 'solid' },
    { x: 1560, y: 460, width: 160, height: 20, type: 'solid' },
    { x: 1760, y: 500, width: 140, height: 20, type: 'solid' },
    // Desk platforms
    { x: 1940, y: 440, width: 120, height: 20, type: 'solid' },
    { x: 2100, y: 390, width: 120, height: 20, type: 'solid' },
    { x: 2260, y: 440, width: 120, height: 20, type: 'solid' },
    { x: 2420, y: 390, width: 100, height: 20, type: 'solid' },
    // Locker corridor
    { x: 2560, y: 500, width: 80,  height: 20, type: 'solid' },
    { x: 2680, y: 460, width: 80,  height: 20, type: 'solid' },
    { x: 2800, y: 420, width: 80,  height: 20, type: 'solid' },
    { x: 2920, y: 380, width: 80,  height: 20, type: 'solid' },
    { x: 3040, y: 340, width: 80,  height: 20, type: 'solid' },
    // Final sprint
    { x: 3160, y: 380, width: 160, height: 20, type: 'solid' },
    { x: 3360, y: 340, width: 140, height: 20, type: 'solid' },
    { x: 3540, y: 300, width: 160, height: 20, type: 'solid' },
    { x: 3740, y: 260, width: 200, height: 20, type: 'solid' },
    { x: 3980, y: 290, width: 280, height: 20, type: 'solid' },
  ],
  checkpoints: [
    { x: 1200, y: 440 },
    { x: 2500, y: 370 },
  ],
  coinPositions: [
    { x: 420, y: 570 }, { x: 620, y: 540 }, { x: 1000, y: 470 },
    { x: 1220, y: 430 }, { x: 1420, y: 390 }, { x: 1980, y: 410 },
    { x: 2140, y: 360 }, { x: 2600, y: 470 }, { x: 2840, y: 390 },
    { x: 3080, y: 310 }, { x: 3400, y: 310 }, { x: 3780, y: 230 },
  ],
  soloHazards: [
    { x: 900,  y: 580, trapId: 'banana_peel' },
    { x: 1550, y: 480, trapId: 'banana_peel' },
    { x: 2050, y: 400, trapId: 'banana_peel' },
    { x: 2700, y: 450, trapId: 'banana_peel' },
    { x: 3200, y: 360, trapId: 'banana_peel' },
    { x: 3680, y: 280, trapId: 'banana_peel' },
  ],
}

export const COURSE_2: CourseDef = {
  id: 'school-dash',
  courseNumber: 2,
  name: 'School Dash',
  subtitle: 'Class is in session',
  theme: 'School hallways and classrooms',
  description: 'Sprint through classrooms, leap over desks, and dodge the hall monitors.',
  map: SCHOOL_DASH,
}

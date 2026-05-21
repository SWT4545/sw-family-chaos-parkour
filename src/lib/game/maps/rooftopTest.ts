import { MapDef } from '@/types/game'

export const ROOFTOP_TEST: MapDef = {
  width: 4400,
  height: 720,
  startPositions: [
    { x: 120, y: 620 },
    { x: 165, y: 620 },
  ],
  finishX: 4200,
  finishY: 325,
  platforms: [
    // Start area — wide landing zone
    { x: 0,    y: 640, width: 380,  height: 30 },

    // Section 1: Easy intro gaps
    { x: 450,  y: 618, width: 160,  height: 20 },
    { x: 680,  y: 590, width: 140,  height: 20 },
    { x: 888,  y: 562, width: 170,  height: 20 },

    // Section 2: Rising platforms
    { x: 1130, y: 528, width: 150,  height: 20 },
    { x: 1360, y: 492, width: 200,  height: 20 },  // CP1 platform

    // Section 3: Mid elevation
    { x: 1640, y: 463, width: 160,  height: 20 },
    { x: 1875, y: 434, width: 180,  height: 20 },
    { x: 2130, y: 404, width: 200,  height: 20 },

    // Section 4: High section
    { x: 2410, y: 372, width: 170,  height: 20 },
    { x: 2652, y: 352, width: 250,  height: 20 },  // CP2 platform

    // Section 5: Technical
    { x: 2984, y: 390, width: 145,  height: 20 },
    { x: 3205, y: 364, width: 160,  height: 20 },
    { x: 3445, y: 338, width: 175,  height: 20 },  // CP3 platform

    // Final approach
    { x: 3700, y: 354, width: 155,  height: 20 },
    { x: 3935, y: 336, width: 380,  height: 30 },  // Finish platform
  ],
  checkpoints: [
    { id: 1, x: 1460, y: 472 },
    { id: 2, x: 2777, y: 332 },
    { id: 3, x: 3532, y: 318 },
  ],
}

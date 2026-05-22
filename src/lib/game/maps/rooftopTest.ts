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

  // Collectible coins — placed above platforms throughout the course
  coinPositions: [
    { x: 510,  y: 590 }, { x: 730,  y: 562 }, { x: 960,  y: 534 },
    { x: 1200, y: 502 }, { x: 1460, y: 465 },
    { x: 1720, y: 436 }, { x: 1960, y: 408 },
    { x: 2200, y: 378 }, { x: 2500, y: 348 },
    { x: 2750, y: 328 }, { x: 3060, y: 365 },
    { x: 3300, y: 340 }, { x: 3510, y: 314 },
    { x: 3760, y: 330 }, { x: 4050, y: 312 },
  ],

  // Solo mode — pre-placed map hazards
  soloHazards: [
    { trapId: 'banana_peel',  x: 560,  y: 608 },
    { trapId: 'slime_puddle', x: 920,  y: 570 },
    { trapId: 'bear_trap',    x: 1250, y: 518 },
    { trapId: 'giant_fan',    x: 1800, y: 448 },
    { trapId: 'banana_peel',  x: 2300, y: 388 },
    { trapId: 'slime_puddle', x: 2720, y: 342 },
    { trapId: 'bear_trap',    x: 3150, y: 354 },
    { trapId: 'giant_fan',    x: 3680, y: 338 },
  ],
}

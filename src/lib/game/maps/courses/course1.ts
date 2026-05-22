import type { CourseDef } from '@/types/game'
import { ROOFTOP_TEST } from '@/lib/game/maps/rooftopTest'

export const COURSE_1: CourseDef = {
  id: 'rooftop-run',
  courseNumber: 1,
  name: 'Rooftop Run',
  subtitle: 'Where it all begins',
  theme: 'Urban rooftop parkour',
  description: 'Master the basics. Jump between rooftops, dodge traps, and reach the finish line.',
  map: ROOFTOP_TEST,
}

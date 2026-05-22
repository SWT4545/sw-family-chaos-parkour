export { COURSE_1 } from './course1'
export { COURSE_2 } from './course2'
export { COURSE_3 } from './course3'
export { COURSE_4 } from './course4'
export { COURSE_5 } from './course5'

import { COURSE_1 } from './course1'
import { COURSE_2 } from './course2'
import { COURSE_3 } from './course3'
import { COURSE_4 } from './course4'
import { COURSE_5 } from './course5'
import type { CourseDef } from '@/types/game'

export const ALL_COURSES: CourseDef[] = [COURSE_1, COURSE_2, COURSE_3, COURSE_4, COURSE_5]

export function getCourseById(id: string): CourseDef | undefined {
  return ALL_COURSES.find(c => c.id === id)
}

export function getNextCourse(courseId: string): CourseDef | null {
  const idx = ALL_COURSES.findIndex(c => c.id === courseId)
  return idx >= 0 && idx < ALL_COURSES.length - 1 ? ALL_COURSES[idx + 1] : null
}

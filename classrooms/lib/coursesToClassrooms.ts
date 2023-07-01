import {
  Meeting,
  Exam,
  Course,
  Section
} from '../../scheduleofclasses/group-sections.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'
import { Building } from './coursesFromFile.ts'

/** Maps building codes to `Building`s. */
export type Buildings = Record<string, Building>

/** Always have Center Hall defined so the map can scroll to it. */
export const defaultBuildings = (): Buildings => ({
  CENTR: { code: 'CENTR', rooms: {} }
})

/**
 * Allows more context for what meetings to show. By default, this only shows
 * regular meetings, such as lectures, and won't include single-day meetings
 * such as midterms and finals.
 */
export type CoursesToClassroomsOptions = {
  /**
   * Whether it's finals week. If so, regular meetings (e.g. lectures) won't be
   * included. Default: false.
   */
  finals?: boolean
  /**
   * The Monday of the current week. By WebReg convention, weeks start on
   * Mondays. This will include exams from the given Monday to the following
   * Sunday. If omitted, exams will not be included.
   */
  monday?: Day
}

export function coursesToClassrooms (
  courses: Course[],
  { finals, monday }: CoursesToClassroomsOptions = {}
): Buildings {
  const nextMonday = monday?.add(7)
  const buildings = defaultBuildings()
  for (const [i, { code, groups }] of courses.entries()) {
    for (const [j, { sections, meetings, exams }] of groups.entries()) {
      const groupCapacity = sections.reduce(
        (cum, curr) => cum + curr.capacity,
        0
      )
      const allMeetings: (Section | Meeting | Exam)[] = [
        ...sections,
        ...meetings,
        ...exams
      ]
      for (const meeting of allMeetings) {
        const { location, time } = meeting
        if (!time || !location || location.building === 'RCLAS') {
          continue
        }
        buildings[location.building] ??= { code: location.building, rooms: {} }
        buildings[location.building].rooms[location.room] ??= []
        if ('date' in meeting) {
          // Exam
          const date = new Day(meeting.date)
          if (!monday || !nextMonday || date < monday || date >= nextMonday) {
            continue
          }
        } else if (finals) {
          // Omit regular meetings during finals week
          continue
        }
        buildings[location.building].rooms[location.room].push({
          ...meeting,
          days: time.days,
          start: Time.from(time.start),
          end: Time.from(time.end),
          capacity: 'capacity' in meeting ? meeting.capacity : groupCapacity,
          course: code,
          index: {
            group: i,
            meeting: j,
            type:
              'capacity' in meeting
                ? 'section'
                : 'date' in meeting
                ? 'exam'
                : 'meeting'
          }
        })
      }
    }
  }
  return buildings
}
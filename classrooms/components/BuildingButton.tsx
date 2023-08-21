/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useCallback } from 'preact/hooks'
import { Time } from '../../util/Time.ts'
import { BuildingDatum } from '../lib/buildings.ts'
import { RoomMeeting } from '../lib/coursesToClassrooms.ts'
import {
  latLongToPixel,
  southwest,
  PADDING,
  northeast
} from '../lib/locations.ts'
import { used } from '../lib/now.ts'

type BuildingButtonProps = {
  weekday: number
  time: Time
  building: BuildingDatum
  rooms: RoomMeeting[][]
  onSelect: (building: string) => void
  selected: boolean
  visible: boolean
}

export function BuildingButton ({
  weekday,
  time,
  building,
  rooms,
  onSelect,
  selected,
  visible
}: BuildingButtonProps) {
  const college = building.college

  const ref = useCallback((button: HTMLButtonElement | null) => {
    if (building.code === 'CENTR' && button) {
      window.requestAnimationFrame(() => {
        const { left, top, width, height } = button.getBoundingClientRect()
        button
          .closest('.buildings')
          ?.scrollBy(
            left + (-window.innerWidth + width) / 2,
            top + (-window.innerHeight + height) / 2
          )
      })
    }
  }, [])

  const { x, y } = latLongToPixel(building.location)

  return (
    <button
      class={`building-btn college-${college} ${selected ? 'selected' : ''} ${
        visible ? '' : 'building-btn-hidden'
      }`}
      style={{
        left: `${x - southwest.x + PADDING.horizontal}px`,
        top: `${y - northeast.y + PADDING.top}px`
      }}
      ref={ref}
      onClick={() => onSelect(building.code)}
    >
      {building.code}
      <span class='room-count'>
        <span class='in-use'>
          {rooms.filter(meetings => meetings.some(used(weekday, time))).length}
        </span>
        /{rooms.length}
      </span>
    </button>
  )
}

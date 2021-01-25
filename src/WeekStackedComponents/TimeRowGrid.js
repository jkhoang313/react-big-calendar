import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import memoize from 'memoize-one'
import { DragDropContext } from 'react-beautiful-dnd'
import { CalendarContext } from '../CalendarContext'

import * as dates from '../utils/dates'
import { inRange, sortEvents } from '../utils/eventLevels'
import Resources from '../utils/Resources'
import * as TimeSlotUtils from '../utils/TimeSlots'
import TimeGridHeader from '../TimeGridHeader'
import TimeRowGutter from './TimeRowGutter'
import TimeSlotRow from './TimeSlotRow'

const TimeRowGrid = props => {
  const {
    events,
    resources,
    range,
    getNow,
    showMultiDayTimes,
    resizable,
    accessors,
    components,
    getters,
    localizer,
    longPressThreshold,
    customSorting,
    onDrillDown,
    getDrilldownView,
  } = props
  const [now, setNow] = useState(getNow())

  useEffect(() => {
    const currentTimeInterval = window.setInterval(() => {
      setNow(getNow())
    }, 60000)

    return () => {
      window.clearInterval(currentTimeInterval)
    }
  }, [])

  const slotMetrics = TimeSlotUtils.getSlotMetrics(props)
  let start = range[0],
    end = range[range.length - 1]
  const numTimeSlotRows = slotMetrics.groups.length

  const memoizedResources = memoize((resources, accessors) =>
    Resources(resources, accessors)
  )

  let allDayEvents = [],
    rangeEventsByHour = Array.from(Array(numTimeSlotRows), () => [])

  events.forEach(event => {
    if (inRange(event, start, end, accessors)) {
      let eStart = accessors.start(event),
        eEnd = accessors.end(event)

      if (
        accessors.allDay(event) ||
        (dates.isJustDate(eStart) && dates.isJustDate(eEnd)) ||
        (!showMultiDayTimes && !dates.eq(eStart, eEnd, 'day'))
      ) {
        allDayEvents.push(event)
      } else {
        const eventEndHours = accessors.end(event).getHours()
        rangeEventsByHour[eventEndHours].push(event)
      }
    }
  })

  allDayEvents.sort((a, b) => sortEvents(a, b, accessors, customSorting))

  return (
    // TODO update onDragEnd
    <CalendarContext.Consumer>
      {({ dndContext }) => (
        <DragDropContext
          onDragStart={provided => {
            const eventId = provided.draggableId

            const event = events.find(e => {
              return accessors.id(e).toString() === eventId.toString()
            })

            dndContext.draggable.onBeginAction(event, 'move')
          }}
          onDragEnd={result => {
            const { destination, source, draggableId } = result

            if (!destination || destination === 'rbc-allday-cell') return
            if (
              destination.droppableId === source.droppableId &&
              destination.index === source.index
            )
              return

            const eventId = draggableId
            const event = events.find(e => {
              return accessors.id(e).toString() === eventId.toString()
            })
            const duration = accessors.end(event) - accessors.start(event)

            const targetEnd = new Date(destination.droppableId.toString())
            const targetStart = new Date(targetEnd - duration)

            const onEnd = dndContext.draggable.onEnd

            return onEnd({ event, start: targetStart, end: targetEnd }) //TODO for now until we get all day drag
          }}
        >
          <div className="rbc-time-row-grid">
            <TimeGridHeader
              range={range}
              events={allDayEvents}
              getNow={getNow}
              localizer={localizer}
              resources={memoizedResources(resources, accessors)}
              accessors={accessors}
              getters={getters}
              components={components}
              longPressThreshold={longPressThreshold}
              onDrillDown={onDrillDown}
              getDrilldownView={getDrilldownView}
              renderGutter={() => (
                <TimeRowGutter group={[]} localizer={localizer} />
              )}
              dragContainerClass=".rbc-allday-cell"
              resizable={resizable}
            />
            <div className="rbc-time-rows-container">
              {slotMetrics.groups.map((grp, index) => (
                <TimeSlotRow
                  key={index}
                  eventsInRow={rangeEventsByHour[index]}
                  range={range}
                  group={grp}
                  now={now}
                  accessors={accessors}
                  components={components}
                  getters={getters}
                  localizer={localizer}
                />
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </CalendarContext.Consumer>
  )
}

TimeRowGrid.defaultProps = {
  step: 60,
  timeslots: 1,
  min: dates.startOf(new Date(), 'day'),
  max: dates.endOf(new Date(), 'day'),
}

TimeRowGrid.propTypes = {
  events: PropTypes.array.isRequired,
  resources: PropTypes.array,

  step: PropTypes.number,
  timeslots: PropTypes.number,
  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),
  getNow: PropTypes.func.isRequired,

  scrollToTime: PropTypes.instanceOf(Date),
  showMultiDayTimes: PropTypes.bool,

  resizable: PropTypes.bool,

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,

  longPressThreshold: PropTypes.number,

  customSorting: PropTypes.shape({
    sortPriority: PropTypes.arrayOf(PropTypes.string),
    customComparators: PropTypes.object,
  }),

  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
}

export default TimeRowGrid

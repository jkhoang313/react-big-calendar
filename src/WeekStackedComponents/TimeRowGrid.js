import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { DragDropContext } from 'react-beautiful-dnd'
import { useCalendarContext } from '../CalendarContext'
import clsx from 'clsx'
import scrollbarSize from 'dom-helpers/scrollbarSize'

import * as dates from '../utils/dates'
import { inRange, sortEvents } from '../utils/eventLevels'
import { handleScrollingHeader } from '../utils/scrolling'
import * as TimeSlotUtils from '../utils/TimeSlots'
import TimeGridHeader from '../TimeGridHeader'
import TimeGridHeaderCells from '../TimeGridHeaderCells'
import TimeRowGutter from './TimeRowGutter'
import TimeSlotRow from './TimeSlotRow'

const TimeRowGrid = props => {
  const {
    events,
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
  const { draggable } = useCalendarContext()
  const [showFixedHeaders, setShowFixedHeaders] = useState(false)

  useEffect(() => {
    const currentTimeInterval = window.setInterval(() => {
      setNow(getNow())
    }, 60000)

    return () => {
      window.clearInterval(currentTimeInterval)
    }
  }, [getNow])

  const slotMetrics = React.useMemo(() => TimeSlotUtils.getSlotMetrics(props), [
    props,
  ])

  let start = range[0],
    end = range[range.length - 1]
  const numTimeSlotRows = slotMetrics.groups.length

  const [allDayEvents, rangeEventsByHour] = React.useMemo(() => {
    let allDayEvents = [],
      rangeEventsByHour = Array.from(Array(numTimeSlotRows), () => [])

    events.forEach(event => {
      if (inRange(event, start, end, accessors)) {
        let eStart = accessors.start(event),
          eEnd = accessors.end(event)

        if (
          accessors.allDay(event) ||
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

    return [allDayEvents, rangeEventsByHour]
  }, [numTimeSlotRows, events, start, end, accessors, showMultiDayTimes])

  const renderGutter = React.useCallback(
    () => <TimeRowGutter localizer={localizer} />,
    [localizer]
  )

  const handleScroll = e => {
    handleScrollingHeader(e, showFixedHeaders, headerShown => {
      setShowFixedHeaders(headerShown)
    })
  }

  return (
    <>
      <div
        className={clsx('rbc-row rbc-fixed-header', {
          'show-header': showFixedHeaders,
        })}
        style={
          scrollbarSize() > 0
            ? {
                paddingRight: `${scrollbarSize()}px`,
              }
            : {}
        }
      >
        <TimeGridHeaderCells
          range={range}
          getNow={getNow}
          localizer={localizer}
          components={components}
          getters={getters}
          onDrillDown={onDrillDown}
          getDrilldownView={getDrilldownView}
        />
      </div>
      <div
        className="rbc-time-row-grid-container-scrollable"
        onScroll={handleScroll}
      >
        <DragDropContext
          onDragStart={provided => {
            const eventId = provided.draggableId

            const event = events.find(e => {
              return accessors.id(e).toString() === eventId.toString()
            })

            draggable.onBeginAction(event, 'move')
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

            const targetEnd = new Date(parseInt(destination.droppableId))
            const targetStart = new Date(targetEnd - duration)

            const onEnd = draggable.onEnd

            return onEnd({ event, start: targetStart, end: targetEnd }) //TODO for now until we get all day drag
          }}
        >
          <TimeGridHeader
            range={range}
            events={allDayEvents}
            getNow={getNow}
            localizer={localizer}
            accessors={accessors}
            getters={getters}
            components={components}
            longPressThreshold={longPressThreshold}
            onDrillDown={onDrillDown}
            getDrilldownView={getDrilldownView}
            renderGutter={renderGutter}
            dragContainerClass=".rbc-allday-cell"
            resizable={resizable}
          />
          <div className="rbc-time-rows-container">
            {slotMetrics.groups.map((grp, index) => (
              <TimeSlotRow
                key={index}
                eventsInRow={rangeEventsByHour[index]}
                range={range}
                group={grp[0]}
                now={now}
                accessors={accessors}
                components={components}
                getters={getters}
                localizer={localizer}
                customSorting={customSorting}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
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

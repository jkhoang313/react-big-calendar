import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { Droppable, Draggable } from 'react-beautiful-dnd'

import * as dates from '../utils/dates'
import { sortEvents } from '../utils/eventLevels'

const TimeCell = ({
  events,
  timeSlot,
  isToday,
  isWeekend,
  now,
  accessors,
  components: { event: Event },
  getters,
  customSorting,
}) => {
  events.sort((a, b) => sortEvents(a, b, accessors, customSorting))
  const userComponentProps = getters.eventComponentProps()
  const showCurrentTimeIndictator = dates.eq(timeSlot, now, 'hours')

  return (
    <Droppable droppableId={`${timeSlot.getTime()}`}>
      {(provided, snapshot) => {
        return (
          <div
            className={clsx(
              'rbc-time-cell',
              isToday && 'rbc-today',
              isWeekend && 'is-weekend-bg',
              snapshot.isDraggingOver && 'rbc-addons-dnd-over'
            )}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {events.map((event, index) => {
              const title = accessors.title(event)

              return (
                <Draggable
                  // TODO change this to accessor?
                  draggableId={`${accessors.id(event)}`}
                  key={`${accessors.id(event)}`}
                  index={index}
                >
                  {provided => {
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="rbc-event"
                      >
                        {Event ? (
                          <Event
                            event={event}
                            title={title}
                            {...userComponentProps}
                          />
                        ) : (
                          title
                        )}
                      </div>
                    )
                  }}
                </Draggable>
              )
            })}
            {showCurrentTimeIndictator && (
              <>
                <div
                  className="rbc-current-time-indicator"
                  style={{
                    top: `calc(${(now.getMinutes() / 60) * 100}% - 1px)`,
                  }}
                />
                <div
                  className="rbc-current-time-dot"
                  style={{
                    top: `calc(${(now.getMinutes() / 60) * 100}% - 0.5rem)`,
                  }}
                />
              </>
            )}
            {provided.placeholder}
          </div>
        )
      }}
    </Droppable>
  )
}

TimeCell.propTypes = {
  events: PropTypes.array.isRequired,

  timeSlot: PropTypes.instanceOf(Date),
  isToday: PropTypes.bool,
  isWeekend: PropTypes.bool,
  now: PropTypes.instanceOf(Date),

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,

  customSorting: PropTypes.shape({
    sortPriority: PropTypes.arrayOf(PropTypes.string),
    customComparators: PropTypes.object,
  }),
}

export default TimeCell

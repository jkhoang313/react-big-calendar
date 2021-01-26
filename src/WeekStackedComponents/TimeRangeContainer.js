import React from 'react'
import PropTypes from 'prop-types'

import * as dates from '../utils/dates'
import TimeCell from './TimeCell'

const TimeRangeContainer = ({
  eventsInRow,
  range,
  group,
  now,
  accessors,
  components,
  getters,
  customSorting,
}) => {
  return (
    <div className="rbc-week-range-container">
      {range.map((date, index) => {
        const events = eventsInRow.filter(event =>
          dates.eq(accessors.end(event), date, 'day')
        )

        return (
          <TimeCell
            key={index}
            timeSlot={dates.merge(date, group[0])}
            isToday={dates.eq(date, now, 'day')}
            isWeekend={date.getDay() === 6 || date.getDay() === 0}
            events={events}
            accessors={accessors}
            components={components}
            getters={getters}
            now={now}
            customSorting={customSorting}
          />
        )
      })}
    </div>
  )
}

TimeRangeContainer.propTypes = {
  eventsInRow: PropTypes.array.isRequired,

  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  group: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  now: PropTypes.instanceOf(Date),

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,

  customSorting: PropTypes.shape({
    sortPriority: PropTypes.arrayOf(PropTypes.string),
    customComparators: PropTypes.object,
  }),
}

export default TimeRangeContainer

import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import TimeRowGutter from './TimeRowGutter'
import TimeRangeContainer from './TimeRangeContainer'

const TimeSlotRow = ({
  eventsInRow,
  range,
  group,
  now,
  accessors,
  components,
  getters,
  localizer,
}) => {
  const rowRef = React.createRef()

  useEffect(() => {
    if (group[0].getHours() === now.getHours() - 1) {
      // rowRef.current.scrollIntoView(true)
    }
  }, [])

  return (
    <div className="rbc-time-slot-row" ref={rowRef}>
      <TimeRowGutter group={group} localizer={localizer} />
      <TimeRangeContainer
        eventsInRow={eventsInRow}
        range={range}
        group={group}
        now={now}
        accessors={accessors}
        components={components}
        getters={getters}
      />
    </div>
  )
}

TimeSlotRow.propTypes = {
  eventsInRow: PropTypes.array.isRequired,

  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  group: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  now: PropTypes.instanceOf(Date),

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
}

export default TimeSlotRow

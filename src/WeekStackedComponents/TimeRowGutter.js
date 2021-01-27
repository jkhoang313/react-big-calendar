import React from 'react'
import PropTypes from 'prop-types'

const TimeRowGutter = ({ group, localizer }) => {
  return (
    <div className="rbc-gutter">
      {group && (
        <span className="rbc-label">
          {localizer.format(group, 'timeGutterFormat')}
        </span>
      )}
    </div>
  )
}

TimeRowGutter.propTypes = {
  group: PropTypes.instanceOf(Date),
  localizer: PropTypes.object.isRequired,
}

export default TimeRowGutter

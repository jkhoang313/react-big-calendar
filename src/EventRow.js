import PropTypes from 'prop-types'
import clsx from 'clsx'
import React from 'react'
import EventRowMixin from './EventRowMixin'
import { accessor } from './utils/propTypes'

class EventRow extends React.Component {
  static contextTypes = {
    draggable: PropTypes.shape({
      onStart: PropTypes.func,
      onEnd: PropTypes.func,
      onBeginAction: PropTypes.func,
      draggableAccessor: accessor,
      resizableAccessor: accessor,
      dragAndDropAction: PropTypes.object,
      onEventChange: PropTypes.func,
    }),
  }

  render() {
    let {
      segments,
      slotMetrics: { slots },
      className,
      accessors,
    } = this.props
    const { draggable } = this.context

    let lastEnd = 1

    return (
      <div className={clsx(className, 'rbc-row')}>
        {segments.reduce((row, { event, left, right, span }, li) => {
          let key = accessors.id(event) || '_lvl_' + li
          let gap = left - lastEnd
          let style = {}

          if (
            draggable.dragAndDropAction.interacting &&
            draggable.dragAndDropAction.event === event
          ) {
            console.log('hi')
            style.zIndex = 99
          }

          let content = EventRowMixin.renderEvent(this.props, event)

          if (gap) row.push(EventRowMixin.renderSpan(slots, gap, `${key}_gap`))

          row.push(EventRowMixin.renderSpan(slots, span, key, content, style))

          lastEnd = right + 1

          return row
        }, [])}
      </div>
    )
  }
}

EventRow.propTypes = {
  segments: PropTypes.array,
  ...EventRowMixin.propTypes,
}

EventRow.defaultProps = {
  ...EventRowMixin.defaultProps,
}

export default EventRow

import PropTypes from 'prop-types'
import clsx from 'clsx'
import React from 'react'
import EventRowMixin from './EventRowMixin'

class EventRow extends React.Component {
  static contextTypes = {
    draggable: PropTypes.shape({
      onStart: PropTypes.func,
      onEnd: PropTypes.func,
      dragAndDropAction: PropTypes.object,
      onDropFromOutside: PropTypes.func,
      onBeginAction: PropTypes.func,
      dragFromOutsideItem: PropTypes.func,
    }),
  }

  render() {
    let {
      segments,
      slotMetrics: { slots },
      className,
      previewSpan,
    } = this.props

    let lastEnd = 1

    return (
      <div className={clsx(className, 'rbc-row')}>
        {segments.reduce((row, { event, left, right, span }, li) => {
          // if (event.__isPreview) {
          //   console.log(event)
          // }

          let key = '_lvl_' + li
          let gap = left - lastEnd

          let content = EventRowMixin.renderEvent(this.props, event)

          if (gap) row.push(EventRowMixin.renderSpan(slots, gap, `${key}_gap`))

          if (
            this.context.draggable.dragAndDropAction.interacting && // if an event is being dragged right now
            this.context.draggable.dragAndDropAction.event === event && // and it's the current event
            previewSpan
          ) {
            row.push(EventRowMixin.renderSpan(slots, previewSpan, key, content))
          } else {
            row.push(EventRowMixin.renderSpan(slots, span, key, content))
          }

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

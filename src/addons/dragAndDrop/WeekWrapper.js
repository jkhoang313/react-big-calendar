import PropTypes from 'prop-types'
import React from 'react'
import * as dates from '../../utils/dates'
import { getSlotAtX, pointInBox } from '../../utils/selection'
import { findDOMNode } from 'react-dom'

import { eventSegments } from '../../utils/eventLevels'
import Selection, { getBoundsForNode } from '../../Selection'
import EventRow from '../../EventRow'
import { dragAccessors } from './common'

const propTypes = {}

const eventTimes = (event, accessors) => {
  let start = accessors.start(event)
  let end = accessors.end(event)

  const isZeroDuration =
    dates.eq(start, end, 'minutes') && start.getMinutes() === 0
  // make zero duration midnight events at least one day long
  if (isZeroDuration) end = dates.add(end, 1, 'day')
  return { start, end }
}
const dragFree = true

class WeekWrapper extends React.Component {
  static propTypes = {
    isAllDay: PropTypes.bool,
    slotMetrics: PropTypes.object.isRequired,
    accessors: PropTypes.object.isRequired,
    getters: PropTypes.object.isRequired,
    components: PropTypes.object.isRequired,
    resourceId: PropTypes.any,
  }

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

  constructor(...args) {
    super(...args)
    this.state = {}
  }

  componentDidMount() {
    this._selectable()
  }

  componentWillUnmount() {
    this._teardownSelectable()
  }

  resetSegment() {
    if (this.state.segment) this.setState({ segment: null })
  }

  resetInitialSegment() {
    if (this.state.initialSegment) this.setState({ initialSegment: null })
  }

  resetState() {
    if (this.state.segment || this.state.initialSegment) {
      this.setState({ segment: null, initialSegment: null })
    }
  }

  update(event, start, end, mouseCoordinates) {
    const segment = eventSegments(
      { ...event, end, start, __isPreview: true },
      this.props.slotMetrics.range,
      dragAccessors
    )

    const { segment: lastSegment, initialSegment } = this.state
    if (
      lastSegment &&
      segment.span === lastSegment.span &&
      segment.left === lastSegment.left &&
      segment.right === lastSegment.right
    ) {
      if (!dragFree || !initialSegment) {
        return
      }
    }

    if (initialSegment) {
      this.setState({
        segment,
        initialSegment: {
          ...initialSegment,
          mouseCoordinates,
        },
      })
    } else {
      this.setState({ segment })
    }
  }

  handleMove = ({ x, y, deltaX, deltaY }, node, draggedEvent) => {
    const event = this.context.draggable.dragAndDropAction.event || draggedEvent
    const metrics = this.props.slotMetrics
    const { accessors } = this.props

    if (!event) return

    let rowBox = getBoundsForNode(node)

    if (!pointInBox(rowBox, { x, y })) {
      const { initialSegment } = this.state
      if (dragFree && initialSegment) {
        this.setState({
          segment: null,
          initialSegment: {
            ...initialSegment,
            mouseCoordinates: { deltaX, deltaY },
          },
        })
      } else {
        this.resetState()
      }
      return
    }

    // Make sure to maintain the time of the start date while moving it to the new slot
    let start = dates.merge(
      metrics.getDateForSlot(getSlotAtX(rowBox, x, false, metrics.slots)),
      accessors.start(event)
    )

    let end = dates.add(
      start,
      dates.diff(accessors.start(event), accessors.end(event), 'minutes'),
      'minutes'
    )

    this.update(event, start, end, { deltaX, deltaY })
  }

  handleDropFromOutside = (point, rowBox) => {
    if (!this.context.draggable.onDropFromOutside) return
    const { slotMetrics: metrics } = this.props

    let start = metrics.getDateForSlot(
      getSlotAtX(rowBox, point.x, false, metrics.slots)
    )

    this.context.draggable.onDropFromOutside({
      start,
      end: dates.add(start, 1, 'day'),
      allDay: false,
    })
  }

  handleDragOverFromOutside = ({ x, y }, node) => {
    if (!this.context.draggable.dragFromOutsideItem) return

    this.handleMove(
      { x, y },
      node,
      this.context.draggable.dragFromOutsideItem()
    )
  }

  handleResize(point, node) {
    const { event, direction } = this.context.draggable.dragAndDropAction
    const { accessors, slotMetrics: metrics } = this.props

    let { start, end } = eventTimes(event, accessors)

    let rowBox = getBoundsForNode(node)
    let cursorInRow = pointInBox(rowBox, point)

    if (direction === 'RIGHT') {
      if (cursorInRow) {
        if (metrics.last < start) return this.resetSegment()
        // add min
        end = dates.add(
          metrics.getDateForSlot(
            getSlotAtX(rowBox, point.x, false, metrics.slots)
          ),
          1,
          'day'
        )
      } else if (
        dates.inRange(start, metrics.first, metrics.last) ||
        (rowBox.bottom < point.y && +metrics.first > +start)
      ) {
        end = dates.add(metrics.last, 1, 'milliseconds')
      } else {
        this.setState({ segment: null })
        return
      }

      end = dates.max(end, dates.add(start, 1, 'day'))
    } else if (direction === 'LEFT') {
      // inbetween Row
      if (cursorInRow) {
        if (metrics.first > end) return this.resetSegment()

        start = metrics.getDateForSlot(
          getSlotAtX(rowBox, point.x, false, metrics.slots)
        )
      } else if (
        dates.inRange(end, metrics.first, metrics.last) ||
        (rowBox.top > point.y && +metrics.last < +end)
      ) {
        start = dates.add(metrics.first, -1, 'milliseconds')
      } else {
        this.resetSegment()
        return
      }

      start = dates.min(dates.add(end, -1, 'day'), start)
    }

    this.update(event, start, end)
  }

  _selectable = () => {
    let node = findDOMNode(this).closest('.rbc-month-row, .rbc-allday-cell')
    let container = node.closest('.rbc-month-view, .rbc-time-view')

    let selector = (this._selector = new Selection(() => container))

    selector.on('beforeSelect', point => {
      const { isAllDay } = this.props
      const { action } = this.context.draggable.dragAndDropAction

      return (
        action === 'move' ||
        (action === 'resize' &&
          (!isAllDay || pointInBox(getBoundsForNode(node), point)))
      )
    })

    selector.on('selecting', box => {
      const bounds = getBoundsForNode(node)
      const { dragAndDropAction } = this.context.draggable

      if (dragAndDropAction.action === 'move') this.handleMove(box, bounds)
      if (dragAndDropAction.action === 'resize') this.handleResize(box, bounds)
    })

    selector.on('selectStart', box => {
      const bounds = getBoundsForNode(node)

      if (dragFree && pointInBox(bounds, box)) {
        const event = this.context.draggable.dragAndDropAction.event

        if (event) {
          this.setState({
            initialSegment: {
              ...eventSegments(
                { ...event, __isPreview: true },
                this.props.slotMetrics.range,
                dragAccessors
              ),
              mouseCoordinates: { deltaX: 0, deltaY: 0 },
            },
          })
        }
      }

      this.context.draggable.onStart()
    })
    selector.on('select', point => {
      const bounds = getBoundsForNode(node)

      if (!this.state.segment || !pointInBox(bounds, point)) {
        if (this.state.initialSegment) {
          this.resetInitialSegment()
        }
        return
      }
      this.handleInteractionEnd()
    })

    selector.on('dropFromOutside', point => {
      if (!this.context.draggable.onDropFromOutside) return

      const bounds = getBoundsForNode(node)

      if (!pointInBox(bounds, point)) return

      this.handleDropFromOutside(point, bounds)
    })

    selector.on('dragOverFromOutside', point => {
      if (!this.context.draggable.dragFromOutsideItem) return

      const bounds = getBoundsForNode(node)

      this.handleDragOverFromOutside(point, bounds)
    })

    selector.on('click', () => this.context.draggable.onEnd(null))

    selector.on('reset', () => {
      this.resetState()
      this.context.draggable.onEnd(null)
    })
  }

  handleInteractionEnd = () => {
    const { resourceId, isAllDay } = this.props
    const { event } = this.state.segment

    this.resetState()

    this.context.draggable.onEnd({
      start: event.start,
      end: event.end,
      resourceId,
      isAllDay,
    })
  }

  _teardownSelectable = () => {
    if (!this._selector) return
    this._selector.teardown()
    this._selector = null
  }

  render() {
    const { children, accessors } = this.props

    let { segment, initialSegment } = this.state

    return (
      <div className="rbc-addons-dnd-row-body">
        {children}

        {segment && (
          <>
            <EventRow
              {...this.props}
              selected={null}
              className="rbc-addons-dnd-drag-row"
              segments={[segment]}
              accessors={{
                ...accessors,
                ...dragAccessors,
              }}
            />
          </>
        )}
        {initialSegment && (
          <EventRow
            {...this.props}
            selected={null}
            className="rbc-addons-dnd-drag-row"
            segments={[initialSegment]}
            accessors={{
              ...accessors,
              ...dragAccessors,
            }}
            style={{
              transform: `translate(${
                initialSegment.mouseCoordinates.deltaX
              }px, ${initialSegment.mouseCoordinates.deltaY}px)`,
            }}
          />
        )}
        {/* {dragFree ? (
          initialSegment && (
            <EventRow
              {...this.props}
              selected={null}
              className="rbc-addons-dnd-drag-row"
              segments={[initialSegment]}
              accessors={{
                ...accessors,
                ...dragAccessors,
              }}
              style={{
                transform: `translate(${initialSegment.mouseCoordinates.deltaX}px, ${
                  initialSegment.mouseCoordinates.deltaY
                }px)`,
              }}
            />
          )
        ) : (
          segment && (
            <EventRow
              {...this.props}
              selected={null}
              className="rbc-addons-dnd-drag-row"
              segments={[segment]}
              accessors={{
                ...accessors,
                ...dragAccessors,
              }}
            />
          )
        )} */}
      </div>
    )
  }
}

WeekWrapper.propTypes = propTypes

export default WeekWrapper

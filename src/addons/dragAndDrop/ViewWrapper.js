import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { useCalendarContext } from '../../CalendarContext'
import { getBoundsForNode } from '../../Selection'
import * as dates from '../../utils/dates'
import { accessor } from '../../utils/propTypes'
import { slotWidth } from '../../utils/selection'
// import { MousePositionContext } from './MousePositionContext'

const getSlotAtX = (rowBox, x, numSlots) => {
  const cellWidth = slotWidth(rowBox, numSlots)

  return Math.floor((x - rowBox.left) / cellWidth)
}

const clickTolerance = 3

const isClick = (pageX, pageY, x, y) => {
  return (
    Math.abs(pageX - x) <= clickTolerance &&
    Math.abs(pageY - y) <= clickTolerance
  )
}

class ViewWrapper extends React.Component {
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

  static childContextTypes = {
    mousePosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      deltaX: PropTypes.number,
      deltaY: PropTypes.number,
      currentSlot: PropTypes.instanceOf(Date),
    }),
  }

  constructor(props) {
    super(props)

    this.initialState = {
      x: null,
      y: null,
      deltaX: 0,
      deltaY: 0,
      currentSlot: null,
    }
    this.state = this.initialState
  }

  getChildContext() {
    return {
      mousePosition: this.state,
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleMouseDown)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleMouseDown)
  }

  handleMouseDown = e => {
    const { action } = this.context.draggable.dragAndDropAction

    if (action === 'move') {
      this.setState({
        x: e.pageX,
        y: e.pageY,
        currentSlot: this.getCurrentDateSlot(e),
      })
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
    }
  }

  handleMouseMove = e => {
    const { accessors } = this.props
    const { dragAndDropAction, onStart, onEventChange } = this.context.draggable
    const { actionOriginalDate, event } = dragAndDropAction
    const { x, y, currentSlot } = this.state
    const hoveredDateSlot = this.getCurrentDateSlot(e)

    // If you're moving over the calendar grid
    if (hoveredDateSlot) {
      if (!actionOriginalDate) {
        if (!isClick(e.pageX, e.pageY, x, y)) {
          onStart(hoveredDateSlot, {
            start: accessors.start(event),
            end: accessors.end(event),
          })
        }
      } else {
        const deltaX = e.pageX - x
        const deltaY = e.pageY - y

        if (!dates.eq(currentSlot, hoveredDateSlot)) {
          const start = dates.add(
            hoveredDateSlot,
            dates.relativeDiff(
              accessors.start(event),
              actionOriginalDate,
              'minutes'
            ),
            'minutes'
          )
          const end = dates.add(
            start,
            dates.diff(accessors.start(event), accessors.end(event), 'minutes'),
            'minutes'
          )

          this.setState({
            currentSlot: hoveredDateSlot,
            deltaX,
            deltaY,
          })
          onEventChange(start, end)
        } else {
          requestAnimationFrame(() => {
            this.setState({
              deltaX,
              deltaY,
            })
          })
        }
      }
      // If you're moving outside the calendar grid
    } else if (event) {
      this.setState({
        currentSlot: actionOriginalDate,
        deltaX: 0,
        deltaY: 0,
      })
      onEventChange(accessors.start(event), accessors.end(event))
    }
  }

  handleMouseUp = e => {
    const { x, y } = this.state
    const { onEnd, dragAndDropAction } = this.context.draggable
    const { hoveredDateRange } = dragAndDropAction

    this.setState(this.initialState)

    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    // Need isAllDay?

    const { start, end } = hoveredDateRange

    onEnd({ start, end })
  }

  getCurrentDateSlot = e => {
    const { slotNum, weeks } = this.props

    const weekEl = e.target.closest('.rbc-month-row, .rbc-allday-cell')
    if (weekEl) {
      const rowBox = getBoundsForNode(weekEl)
      const slotNumber = getSlotAtX(rowBox, e.pageX, slotNum)
      // Need to change weeks to be more generic?
      return weeks[weekEl.dataset.rowNum][slotNumber]
    }
    return null
  }

  render() {
    const { className, children } = this.props
    const { deltaX, deltaY, x, y } = this.state

    return (
      <div className={className}>
        {children}
        {/* <div
          className="drag-preview"
          style={{
            height: '100px',
            width: '100px',
            backgroundColor: 'gray',
            position: 'fixed',
            top: y,
            left: x,
            transform: `translate(${deltaX}px, ${deltaY}px)`,
            zIndex: 100,
          }}
        >

        </div> */}
      </div>
    )
  }
}

export default ViewWrapper

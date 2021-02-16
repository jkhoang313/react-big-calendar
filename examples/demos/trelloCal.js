import React from 'react'
import { Calendar, Views, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'

import events from '../events'

const localizer = momentLocalizer(moment)

const DragAndDropCalendar = withDragAndDrop(Calendar)

class TrelloCal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      events: events,
    }

    this.moveEvent = this.moveEvent.bind(this)
  }

  handleDragStart = event => {
    this.setState({ draggedEvent: event })
  }

  moveEvent = ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    const { events } = this.state

    let allDay = event.allDay

    if (!event.allDay && droppedOnAllDaySlot) {
      allDay = true
    } else if (event.allDay && !droppedOnAllDaySlot) {
      allDay = false
    }

    const nextEvents = events.map(existingEvent => {
      return existingEvent.id == event.id
        ? { ...existingEvent, start, end }
        : existingEvent
    })

    this.setState({
      events: nextEvents,
    })
  }

  resizeEvent = ({ event, start, end }) => {
    const { events } = this.state

    const nextEvents = events.map(existingEvent => {
      return existingEvent.id == event.id
        ? { ...existingEvent, start, end }
        : existingEvent
    })

    this.setState({
      events: nextEvents,
    })
  }

  render() {
    return (
      <DragAndDropCalendar
        localizer={localizer}
        events={this.state.events}
        formats={{
          dateFormat: 'D',
          monthHeaderFormat: 'MMM YYYY',
          dayFormat: 'D',
          dayRangeHeaderFormat: ({ start }, _, localizer) =>
            localizer.format(start, 'MMM YYYY'),
          timeGutterFormat: 'h A',
        }}
        onEventDrop={this.moveEvent}
        resizable
        onEventResize={this.resizeEvent}
        views={[Views.MONTH, Views.WEEK]}
        // defaultView={Views.WEEK}
        expandRow
        messages={{
          showMore: count => {
            return `Show all cards (${count})`
          },
        }}
        enableArrowNav
        defaultDate={new Date(2021, 3, 12)}
      />
    )
  }
}

export default TrelloCal

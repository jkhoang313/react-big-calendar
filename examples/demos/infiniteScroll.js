import React from 'react'
import { Calendar, Views } from 'react-big-calendar'
import events from '../events'
import * as dates from '../../src/utils/dates'

let allViews = Object.keys(Views).map(k => Views[k])

let InfiniteScroll = ({ localizer }) => (
  <Calendar
    events={events}
    max={dates.add(dates.endOf(new Date(2015, 17, 1), 'day'), -1, 'hours')}
    defaultDate={new Date(2015, 3, 1)}
    localizer={localizer}
    infiniteScroll={true}
    popup
  />
)

export default InfiniteScroll

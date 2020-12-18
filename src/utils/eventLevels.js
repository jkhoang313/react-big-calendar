import findIndex from 'lodash/findIndex'
import * as dates from './dates'
import { isFunction } from './helpers'

export function endOfRange(dateRange, unit = 'day') {
  return {
    first: dateRange[0],
    last: dates.add(dateRange[dateRange.length - 1], 1, unit),
  }
}

export function eventSegments(event, range, accessors) {
  let { first, last } = endOfRange(range)

  let slots = dates.diff(first, last, 'day')
  let start = dates.max(dates.startOf(accessors.start(event), 'day'), first)
  let end = dates.min(dates.ceil(accessors.end(event), 'day'), last)

  let padding = findIndex(range, x => dates.eq(x, start, 'day'))
  let span = dates.diff(start, end, 'day')

  span = Math.min(span, slots)
  span = Math.max(span, 1)

  return {
    event,
    span,
    left: padding + 1,
    right: Math.max(padding + span, 1),
  }
}

export function eventLevels(rowSegments, limit = Infinity) {
  let i,
    j,
    seg,
    levels = [],
    extra = []

  for (i = 0; i < rowSegments.length; i++) {
    seg = rowSegments[i]

    for (j = 0; j < levels.length; j++) {
      // Check to see if this event overlaps with any other event
      // in this level
      if (!segsOverlap(seg, levels[j])) {
        // If this event doesn't overlap, we can render this event
        // in the current level if:
        // - `alwaysDisplayBelow` is not explicitly set OR
        // - there are no other levels below this level OR
        // - this event doesn't overlap with any event below this level
        if (
          !seg.event.alwaysDisplayBelow ||
          j === levels.length - 1 ||
          levels.slice(j).every(level => !segsOverlap(seg, level))
        ) {
          break
        }
      }
    }

    if (j >= limit) {
      extra.push(seg)
    } else {
      ;(levels[j] || (levels[j] = [])).push(seg)
    }
  }

  for (i = 0; i < levels.length; i++) {
    levels[i].sort((a, b) => a.left - b.left) //eslint-disable-line
  }

  return { levels, extra }
}

export function inRange(e, start, end, accessors) {
  let eStart = dates.startOf(accessors.start(e), 'day')
  let eEnd = accessors.end(e)

  let startsBeforeEnd = dates.lte(eStart, end, 'day')
  let endsAfterStart = dates.gte(eEnd, start, 'day')

  return startsBeforeEnd && endsAfterStart
}

export function segsOverlap(seg, otherSegs) {
  return otherSegs.some(
    otherSeg => otherSeg.left <= seg.right && otherSeg.right >= seg.left
  )
}

export function sortEvents(evtA, evtB, accessors, customSorting = {}) {
  const {
    sortPriority = ['startDay', 'duration', 'allDay', 'startTime'],
    customComparators = {},
  } = customSorting

  let startSort =
    +dates.startOf(accessors.start(evtA), 'day') -
    +dates.startOf(accessors.start(evtB), 'day')

  let durA = dates.diff(
    accessors.start(evtA),
    dates.ceil(accessors.end(evtA), 'day'),
    'day'
  )

  let durB = dates.diff(
    accessors.start(evtB),
    dates.ceil(accessors.end(evtB), 'day'),
    'day'
  )
  const sortComparisons = {
    startDay: startSort,
    duration: Math.max(durB, 1) - Math.max(durA, 1),
    allDay: !!accessors.allDay(evtB) - !!accessors.allDay(evtA),
    startTime: +accessors.start(evtA) - +accessors.start(evtB),
  }

  for (let i = 0; i < sortPriority.length; i++) {
    const sortName = sortPriority[i]
    let sortValue
    if (customComparators.hasOwnProperty(sortName)) {
      const sortValueFx = customComparators[sortName]
      if (isFunction(sortValueFx)) {
        sortValue = sortValueFx(evtA, evtB)
      }
    } else if (sortComparisons.hasOwnProperty(sortName)) {
      sortValue = sortComparisons[sortName]
    }
    if (sortValue) {
      return sortValue
    }
  }
  return 0
}
export function sortEvents2(evtA, evtB, accessors) {
  let startSort =
    +dates.startOf(accessors.start(evtA), 'day') -
    +dates.startOf(accessors.start(evtB), 'day')

  let durA = dates.diff(
    accessors.start(evtA),
    dates.ceil(accessors.end(evtA), 'day'),
    'day'
  )

  let durB = dates.diff(
    accessors.start(evtB),
    dates.ceil(accessors.end(evtB), 'day'),
    'day'
  )

  return (
    startSort || // sort by start Day first
    Math.max(durB, 1) - Math.max(durA, 1) || // events spanning multiple days go first
    !!accessors.allDay(evtB) - !!accessors.allDay(evtA) || // then allDay single day events
    +accessors.start(evtA) - +accessors.start(evtB)
  ) // then sort by start time
}

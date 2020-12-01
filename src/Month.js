import PropTypes from 'prop-types'
import React from 'react'
import { findDOMNode } from 'react-dom'
import clsx from 'clsx'

import * as dates from './utils/dates'
import chunk from 'lodash/chunk'
import debounce from 'lodash/debounce'

import { navigate, views } from './utils/constants'
import { notify } from './utils/helpers'
import getPosition from 'dom-helpers/position'
import * as animationFrame from 'dom-helpers/animationFrame'

import Popup from './Popup'
import Overlay from 'react-overlays/Overlay'
import DateContentRow from './DateContentRow'
import Header from './Header'
import DateHeader from './DateHeader'

import { inRange, sortEvents } from './utils/eventLevels'

let eventsForWeek = (evts, start, end, accessors) =>
  evts.filter(e => inRange(e, start, end, accessors))

class MonthView extends React.Component {
  constructor(props) {
    super(props)

    this._bgRows = []
    this._pendingSelection = []
    this.slotRowRef = React.createRef()
    this.scrollContainer = React.createRef()
    this.currentMonthStartingRow = React.createRef()
    this.currentMonthEndingRow = React.createRef()
    this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
      visibleDays: dates.visibleDays(
        props.date,
        props.localizer,
        props.infiniteScroll
      ),
      preventNewVisibleDays: false,
    }
  }

  UNSAFE_componentWillReceiveProps({ date }) {
    this.setState({
      needLimitMeasure: !dates.eq(date, this.props.date, 'month'),
    })
  }

  componentDidMount() {
    let running

    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)

    window.addEventListener(
      'resize',
      (this._resizeListener = () => {
        if (!running) {
          animationFrame.request(() => {
            running = false
            this.setState({ needLimitMeasure: true }) //eslint-disable-line
          })
        }
      }),
      false
    )

    if (this.props.infiniteScroll) {
      this.scrollToCurrentMonth()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { date, localizer, infiniteScroll } = this.props

    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)

    // if (prevProps.date !== date) {
    //   this.setState({
    //     visibleDays: dates.visibleDays(date, localizer, infiniteScroll),
    //   })
    // }
    // Check that enough weeks are rendered
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false)
  }

  getContainer = () => {
    return findDOMNode(this)
  }

  scrollToCurrentMonth = () => {
    const scrollContainer = this.scrollContainer.current
    // console.log(this.currentMonthStartingRow.current)
    // console.log(dates.firstVisibleDay(this.props.date, this.props.localizer))
    // const rows = month.getElementsByClassName('rbc-month-row')
    // const rowHeight = rows[0].offsetHeight
    // setTimeout(() => {
    // console.log('this', scrollContainer.getElementsByClassName('rbc-month-row')[0].offsetTop)
    // console.log('this', scrollContainer.getElementsByClassName('rbc-month-row')[1].offsetTop)
    // console.log('this', scrollContainer.getElementsByClassName('rbc-month-row')[2].offsetTop)
    // scrollContainer.scrollTop = scrollContainer.getElementsByClassName('rbc-month-row')[9].offsetTop
    // }, 2000)
  }

  handleScroll = e => {
    this.checkRenderWeeks(e.target)
    this.checkCurrentMonth(e.target)
  }

  checkRenderWeeks = node => {
    //  if (scrollDistanceTop < scrollThreshold) {
    //     // console.log('render top weeks')
    //     // this.props.onNavigate('PREV')
    //     // this.setState({
    //     //   scrollY: scrollPos + diff,
    //     // })
    //   } else if (scrollThresholdBottom > currentCenterDistance) {
    //     console.log('render bottom weeks')
    //     // this.setState({})
    //     // this.props.onNavigate('NEXT')
    //     // this.setState({
    //     //   scrollY: scrollPos - diff,
    //     // })
    //   }
  }

  checkCurrentMonth = debounce(node => {
    const rows = node.getElementsByClassName('rbc-month-row')
    if (rows.length) {
      // Need to account for variable row heights
      const rowHeight = rows[0].offsetHeight
      const totalRows = rows.length
      const scrollContainerHeight = node.offsetHeight
      const scrollDistanceTop = node.scrollTop
      // scrollDistance bottom doesn't account for variable row heights
      const scrollDistanceBottom =
        totalRows * rowHeight - scrollDistanceTop - scrollContainerHeight
      // Ensure at least 6 weeks before and after are loaded
      // for smooth experience
      const scrollThreshold = rowHeight * 6
      const currentCenterDistance =
        scrollDistanceTop + scrollContainerHeight / 2
      const topOfCurrentMonth = this.currentMonthStartingRow.current.offsetTop
      const bottomOfCurrentMonth =
        this.currentMonthEndingRow.current.offsetTop +
        this.currentMonthEndingRow.current.offsetHeight

      const scrollThresholdBottom = rows[totalRows - 7]
      console.log(currentCenterDistance)
      console.log(scrollThresholdBottom.offsetTop)

      if (currentCenterDistance < topOfCurrentMonth) {
        console.log('prev')
        this.props.onNavigate('PREV')
      } else if (currentCenterDistance > bottomOfCurrentMonth) {
        console.log('next')
        this.props.onNavigate('NEXT')
      }
    }
  }, 50)

  render() {
    let { date, localizer, className, infiniteScroll } = this.props,
      { visibleDays } = this.state,
      weeks = chunk(visibleDays, 7)
    this._weekCount = weeks.length
    // console.log(this.state)

    return (
      <div
        className={clsx(
          'rbc-month-view',
          infiniteScroll && 'rbc-month-view-infinite'
        )}
      >
        <div className="rbc-row rbc-month-header">
          {this.renderHeaders(weeks[0])}
        </div>
        <div
          className={clsx(
            'rbc-month-rows-container',
            className,
            infiniteScroll && 'rbc-month-rows-container-infinite'
          )}
          onScroll={this.handleScroll}
          ref={this.scrollContainer}
        >
          {weeks.map(this.renderWeek)}
          {this.props.popup && this.renderOverlay()}
        </div>
      </div>
    )
  }

  renderWeek = (week, weekIdx) => {
    let {
      events,
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters,
      infiniteScroll,
    } = this.props

    const { needLimitMeasure, rowLimit } = this.state

    events = eventsForWeek(events, week[0], week[week.length - 1], accessors)

    events.sort((a, b) => sortEvents(a, b, accessors))

    const dateStartOfMonth = dates.startOf(date, 'month')
    const dateEndOfMonth = dates.endOf(date, 'month')
    const rowStartOfweek = week[0]
    let scrollRef
    if (dates.eq(dateStartOfMonth, rowStartOfweek, 'week')) {
      scrollRef = this.currentMonthStartingRow
    } else if (dates.eq(dateEndOfMonth, rowStartOfweek, 'week')) {
      scrollRef = this.currentMonthEndingRow
    }

    return (
      <DateContentRow
        key={week[0].toString()}
        scrollRef={scrollRef}
        container={this.getContainer}
        className={clsx(
          'rbc-month-row',
          infiniteScroll && 'rbc-month-row-infinite'
        )}
        getNow={getNow}
        date={date}
        range={week}
        events={events}
        maxRows={Infinity}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onKeyPress={this.handleKeyPressEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
        resizable={this.props.resizable}
      />
    )
  }

  readerDateHeading = ({ date, className, ...props }) => {
    let { date: currentDate, getDrilldownView, localizer } = this.props

    let isOffRange = dates.month(date) !== dates.month(currentDate)
    let isCurrent = dates.eq(date, currentDate, 'day')
    let drilldownView = getDrilldownView(date)
    let label = localizer.format(date, 'dateFormat')
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader

    return (
      <div
        {...props}
        className={clsx(
          className,
          isOffRange && 'rbc-off-range',
          isCurrent && 'rbc-current'
        )}
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={e => this.handleHeadingClick(date, drilldownView, e)}
        />
      </div>
    )
  }

  renderHeaders(row) {
    let { localizer, components } = this.props
    let first = row[0]
    let last = row[row.length - 1]
    let HeaderComponent = components.header || Header

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className="rbc-header">
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, 'weekdayFormat')}
        />
      </div>
    ))
  }

  renderOverlay() {
    let overlay = (this.state && this.state.overlay) || {}
    let {
      accessors,
      localizer,
      components,
      getters,
      selected,
      popupOffset,
    } = this.props

    return (
      <Overlay
        rootClose
        placement="bottom"
        show={!!overlay.position}
        onHide={() => this.setState({ overlay: null })}
        target={() => overlay.target}
      >
        {({ props }) => (
          <Popup
            {...props}
            popupOffset={popupOffset}
            accessors={accessors}
            getters={getters}
            selected={selected}
            components={components}
            localizer={localizer}
            position={overlay.position}
            show={this.overlayDisplay}
            events={overlay.events}
            slotStart={overlay.date}
            slotEnd={overlay.end}
            onSelect={this.handleSelectEvent}
            onDoubleClick={this.handleDoubleClickEvent}
            onKeyPress={this.handleKeyPressEvent}
            handleDragStart={this.props.handleDragStart}
          />
        )}
      </Overlay>
    )
  }

  measureRowLimit() {
    this.setState({
      needLimitMeasure: false,
      // rowLimit: this.slotRowRef.current.getRowLimit(),
    })
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range)

    clearTimeout(this._selectTimer)
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo))
  }

  handleHeadingClick = (date, view, e) => {
    e.preventDefault()
    this.clearSelection()
    notify(this.props.onDrillDown, [date, view])
  }

  handleSelectEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onSelectEvent, args)
  }

  handleDoubleClickEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onDoubleClickEvent, args)
  }

  handleKeyPressEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onKeyPressEvent, args)
  }

  handleShowMore = (events, date, cell, slot, target) => {
    const { popup, onDrillDown, onShowMore, getDrilldownView } = this.props
    //cancel any pending selections so only the event click goes through.
    this.clearSelection()

    if (popup) {
      let position = getPosition(cell, findDOMNode(this))

      this.setState({
        overlay: { date, events, position, target },
      })
    } else {
      notify(onDrillDown, [date, getDrilldownView(date) || views.DAY])
    }

    notify(onShowMore, [events, date, slot])
  }

  overlayDisplay = () => {
    this.setState({
      overlay: null,
    })
  }

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice()

    this._pendingSelection = []

    slots.sort((a, b) => +a - +b)

    notify(this.props.onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1],
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box,
    })
  }

  clearSelection() {
    clearTimeout(this._selectTimer)
    this._pendingSelection = []
  }
}

MonthView.propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),
  infiniteScroll: PropTypes.bool,

  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),

  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,

  scrollToTime: PropTypes.instanceOf(Date),
  rtl: PropTypes.bool,
  resizable: PropTypes.bool,
  width: PropTypes.number,

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onKeyPressEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,

  popup: PropTypes.bool,
  handleDragStart: PropTypes.func,

  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
}

MonthView.range = (date, { localizer }) => {
  const { infiniteScroll } = this.props
  let start = dates.firstVisibleDay(date, localizer, infiniteScroll)
  let end = dates.lastVisibleDay(date, localizer, infiniteScroll)
  return { start, end }
}

MonthView.navigate = (date, action) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -1, 'month')

    case navigate.NEXT:
      return dates.add(date, 1, 'month')

    default:
      return date
  }
}

MonthView.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat')

export default MonthView

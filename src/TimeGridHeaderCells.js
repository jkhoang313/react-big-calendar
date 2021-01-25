import PropTypes from 'prop-types'
import clsx from 'clsx'
import React from 'react'

import * as dates from './utils/dates'
import Header from './Header'
import { notify } from './utils/helpers'

class TimeGridHeaderCells extends React.Component {
  handleHeaderClick = (date, view, e) => {
    e.preventDefault()
    notify(this.props.onDrillDown, [date, view])
  }

  render() {
    let {
      localizer,
      getDrilldownView,
      getNow,
      getters: { dayProp },
      components: {
        header: HeaderComponent = Header,
        headerWrapper: HeaderWrapper,
      },
      range
    } = this.props

    const today = getNow()

    return range.map((date, i) => {
      let drilldownView = getDrilldownView(date)
      let label = localizer.format(date, 'dayFormat')

      const { className, style } = dayProp(date)

      let header = (
        <HeaderComponent date={date} label={label} localizer={localizer} />
      )

      return (
        <HeaderWrapper key={i} value={date}>
          <div
            key={i}
            style={style}
            className={clsx(
              'rbc-header',
              className,
              dates.eq(date, today, 'day') && 'rbc-today'
            )}
          >
            {drilldownView ? (
              <a
                href="#"
                onClick={e => this.handleHeaderClick(date, drilldownView, e)}
              >
                {header}
              </a>
            ) : (
              <span>{header}</span>
            )}
          </div>
        </HeaderWrapper>
      )
    })
  }
}

TimeGridHeaderCells.propTypes = {
  range: PropTypes.array.isRequired,
  getNow: PropTypes.func.isRequired,

  localizer: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,

  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
}

export default TimeGridHeaderCells

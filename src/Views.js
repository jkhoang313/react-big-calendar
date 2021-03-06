import { views } from './utils/constants'
import Month from './Month'
import Day from './Day'
// import Week from './Week'
import WorkWeek from './WorkWeek'
import WeekStacked from './WeekStacked'
import Agenda from './Agenda'

const VIEWS = {
  [views.MONTH]: Month,
  [views.WEEK]: WeekStacked,
  [views.WORK_WEEK]: WorkWeek,
  [views.WEEK_STACKED]: WeekStacked,
  [views.DAY]: Day,
  [views.AGENDA]: Agenda,
}

export default VIEWS

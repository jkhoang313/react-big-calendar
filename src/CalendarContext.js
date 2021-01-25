import React from 'react'

const CalendarContext = React.createContext()

export function useCalendarContext() {
  const context = React.useContext(CalendarContext)

  if (context === undefined) {
    throw new Error(
      'The useCalendarContext hook must be used within a CalendarContext.Provider'
    )
  }
  return context
}

export const CalendarProvider = CalendarContext.Provider

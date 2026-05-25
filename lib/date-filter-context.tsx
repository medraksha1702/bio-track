'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { DEFAULT_FILTER, type DateFilter } from './date-filters'

interface DateFilterContextType {
  dateFilter: DateFilter
  setDateFilter: (filter: DateFilter) => void
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined)

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_FILTER)

  const handleSetDateFilter = useCallback((filter: DateFilter) => {
    setDateFilter(filter)
  }, [])

  return (
    <DateFilterContext.Provider value={{ dateFilter, setDateFilter: handleSetDateFilter }}>
      {children}
    </DateFilterContext.Provider>
  )
}

export function useDateFilter() {
  const context = useContext(DateFilterContext)
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider')
  }
  return context
}

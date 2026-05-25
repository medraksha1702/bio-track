'use client'

import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { DateFilterProvider } from '@/lib/date-filter-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <DateFilterProvider>
        {children}
      </DateFilterProvider>
    </Provider>
  )
}

import { configureStore } from '@reduxjs/toolkit'
import { bioTrackApi } from './services/api'

export const store = configureStore({
  reducer: {
    [bioTrackApi.reducerPath]: bioTrackApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(bioTrackApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

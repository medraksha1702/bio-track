import { useState, useEffect, useCallback, useRef } from 'react'
import { useGetPaginatedTransactionsQuery } from '@/lib/services/api'
import type { TransactionFilter } from '@/lib/date-filters'
import type { Transaction } from '@/lib/data'

interface UseInfiniteTransactionsParams {
  filterParams?: TransactionFilter
  pageSize?: number
  enabled?: boolean
}

interface UseInfiniteTransactionsResult {
  transactions: Transaction[]
  isLoading: boolean
  isFetchingMore: boolean
  isError: boolean
  hasMore: boolean
  loadMore: () => void
  reset: () => void
  totalLoaded: number
}

/**
 * Custom hook for infinite scroll pagination of transactions.
 * Manages cursor-based pagination and accumulates results.
 */
export function useInfiniteTransactions({
  filterParams,
  pageSize = 50,
  enabled = true,
}: UseInfiniteTransactionsParams = {}): UseInfiniteTransactionsResult {
  const [pages, setPages] = useState<Transaction[][]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const prevFilterRef = useRef<string | undefined>(undefined)

  // Build query parameters - always provide an object, even if empty
  const queryParams = {
    ...(filterParams || {}),
    cursor,
    limit: pageSize,
  }

  // Serialize filter params to detect changes
  const filterKey = JSON.stringify(filterParams || {})

  // Reset pagination when filters change
  useEffect(() => {
    if (prevFilterRef.current !== filterKey) {
      setPages([])
      setCursor(undefined)
      setHasMore(true)
      prevFilterRef.current = filterKey
    }
  }, [filterKey])

  // Fetch current page
  const { data, isLoading, isFetching, isError } = useGetPaginatedTransactionsQuery(
    queryParams as any, // Type assertion needed for RTK Query
    {
      skip: !enabled || !hasMore,
    }
  )

  // Update pages when data arrives
  useEffect(() => {
    if (data?.data) {
      setPages((prev) => {
        // If cursor is undefined, this is the first page - replace all
        if (cursor === undefined) {
          return [data.data]
        }
        // Otherwise append to existing pages
        return [...prev, data.data]
      })
      setHasMore(data.pagination.hasMore)
      // Don't set cursor yet - wait for explicit loadMore call
    }
  }, [data, cursor])

  // Flatten all pages into single array
  const allTransactions = pages.flat()

  // Load next page
  const loadMore = useCallback(() => {
    if (data?.pagination.nextCursor && !isFetching && hasMore) {
      setCursor(data.pagination.nextCursor)
    }
  }, [data?.pagination.nextCursor, isFetching, hasMore])

  // Reset to first page
  const reset = useCallback(() => {
    setPages([])
    setCursor(undefined)
    setHasMore(true)
  }, [])

  // Determine if we're fetching more (not initial load)
  const isFetchingMore = isFetching && pages.length > 0

  return {
    transactions: allTransactions,
    isLoading: isLoading && pages.length === 0, // Only true on initial load
    isFetchingMore,
    isError,
    hasMore,
    loadMore,
    reset,
    totalLoaded: allTransactions.length,
  }
}

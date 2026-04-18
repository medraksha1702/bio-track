# Pagination Implementation

This project uses **cursor-based pagination** with infinite scroll for efficient handling of large transaction datasets.

## Architecture

### Backend (API Route)
- **File**: `app/api/transactions/route.ts`
- **Method**: GET endpoint supports pagination via query params:
  - `limit`: Number of records per page (default: 50, max: 100)
  - `cursor`: ISO timestamp for cursor-based pagination
  - `startDate` / `endDate`: Date range filters (still supported)
  
**Response Format**:
```typescript
{
  data: Transaction[],
  pagination: {
    hasMore: boolean,
    nextCursor: string | null,
    count: number
  }
}
```

### Frontend

#### 1. RTK Query API (`lib/services/api.ts`)
- `getTransactions`: Backwards-compatible query (transforms paginated response to flat array)
- `getPaginatedTransactions`: New query endpoint that returns full pagination metadata

#### 2. Custom Hooks
- **`useInfiniteTransactions`** (`lib/use-infinite-transactions.ts`):
  - Manages cursor-based pagination state
  - Accumulates pages of results
  - Provides `loadMore()` function
  - Auto-resets when filters change
  
- **`useIntersectionObserver`** (`lib/use-intersection-observer.ts`):
  - Detects when user scrolls near a trigger element
  - Triggers `loadMore()` automatically
  - Configurable threshold and root margin

#### 3. Components

**TransactionsTable** (`components/transactions-table.tsx`):
- Supports both infinite scroll (full table) and limited preview modes
- Props:
  - `enableInfiniteScroll`: Enable/disable infinite scroll
  - `pageSize`: Records per page (default: 50)
  - `limit`: For preview mode (disables infinite scroll)

**IncomeTable / ExpenseTable** (`components/income-table.tsx`, `components/expense-table.tsx`):
- Uses simpler client-side pagination with prev/next buttons
- Props:
  - `pageSize`: Records per page (default: 20)
- Shows pagination controls only when data exceeds page size

## Database Optimization

### Indexes
- `idx_transactions_created`: Index on `created_at` (descending) for cursor-based sorting
- `idx_transactions_date`: Index on `date` (descending) for date filtering
- `idx_transactions_date_created`: Composite index for combined date + cursor queries

**Migration**: `supabase/migrations/20260418_pagination_indexes.sql`

## Performance Considerations

### Why Cursor-Based Pagination?
1. **Consistent results**: No "missing records" when data is inserted/deleted during pagination
2. **Performance**: Uses indexed timestamp rather than OFFSET (which becomes slow with large offsets)
3. **Scalability**: Page performance remains constant regardless of page number

### Page Size Tuning
- **Default: 50 records** - Good balance for most use cases
- **Max: 100 records** - Prevents excessive data transfer
- Adjust based on:
  - Average transaction data size
  - Network conditions
  - Client device performance

### Filter Changes
- Pagination automatically resets when filters change
- Summary queries remain separate (not paginated) for accurate totals

## Usage Examples

### Infinite Scroll Table (Full Page)
```tsx
<TransactionsTable 
  filterParams={filterParams}
  enableInfiniteScroll={true}
  pageSize={50}
/>
```

### Preview Table (Limited)
```tsx
<TransactionsTable 
  filterParams={filterParams}
  limit={10}
  title="Recent Transactions"
/>
```

### Client-Side Pagination
```tsx
<IncomeTable 
  filterParams={filterParams}
  pageSize={20}
/>
```

## Testing

### Test with Large Datasets
1. Create 500+ transactions using seed scripts
2. Verify smooth scrolling without lag
3. Check network tab: only 50-100 records per request
4. Confirm "Load more" triggers at scroll threshold

### Test Filter Changes
1. Apply date range filter
2. Verify pagination resets to page 1
3. Change filter again
4. Confirm no duplicate records

### Test Edge Cases
- Empty results
- Single page of results
- Network errors during fetch
- Rapid scrolling

## Future Enhancements

- [ ] Virtual scrolling for 1000+ visible records
- [ ] Server-side search/filtering (currently client-side)
- [ ] Configurable page size in settings
- [ ] Prefetch next page on hover
- [ ] Export with pagination (streaming for very large datasets)

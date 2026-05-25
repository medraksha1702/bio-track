import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Transaction } from '@/lib/data'
import type { TransactionFilter } from '@/lib/date-filters'

export type { TransactionFilter }

export type TransactionSummary = {
  totalIncome: number
  totalExpense: number
  profit: number
}

export type PaginatedTransactionsResponse = {
  data: Transaction[]
  pagination: {
    hasMore: boolean
    nextCursor: string | null
    count: number
  }
}

export type NewTransaction = {
  type: 'income' | 'expense'
  client: string
  category: string
  amount: number
  date: string
  notes?: string
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  attachment_type?: string | null
}

export type UpdateTransaction = NewTransaction & { id: string }

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  created_at: string
}

export type NewCategory = { name: string; type: 'income' | 'expense' }
export type UpdateCategory = { id: string; name: string }

export type Customer = {
  id: string
  name: string
  contact_number?: string | null
  gst_number?: string | null
  bill_to_address?: string | null
  ship_to_address?: string | null
  created_at: string
}
export type NewCustomer = {
  name: string
  contact_number?: string
  gst_number?: string
  bill_to_address?: string
  ship_to_address?: string
}
export type UpdateCustomer = {
  id: string
  name: string
  contact_number?: string | null
  gst_number?: string | null
  bill_to_address?: string | null
  ship_to_address?: string | null
}

function buildQuery(base: string, filter?: TransactionFilter): string {
  if (!filter?.startDate && !filter?.endDate) return base
  const sp = new URLSearchParams()
  if (filter.startDate) sp.set('startDate', filter.startDate)
  if (filter.endDate) sp.set('endDate', filter.endDate)
  return `${base}?${sp.toString()}`
}

function buildPaginatedQuery(
  base: string,
  filter?: TransactionFilter & { cursor?: string; limit?: number }
): string {
  const sp = new URLSearchParams()
  if (filter?.startDate) sp.set('startDate', filter.startDate)
  if (filter?.endDate) sp.set('endDate', filter.endDate)
  if (filter?.cursor) sp.set('cursor', filter.cursor)
  if (filter?.limit) sp.set('limit', filter.limit.toString())
  return sp.toString() ? `${base}?${sp.toString()}` : base
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  created_at: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type Invoice = {
  id: string
  invoice_number: string
  client_name: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string | null
  transaction_id?: string | null
  created_at: string
  invoice_items?: InvoiceItem[]
}

export type NewInvoiceItem = {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export type NewInvoice = {
  client_name: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string
  transaction_id?: string | null
  items: NewInvoiceItem[]
}

export type UpdateInvoice = Partial<Omit<NewInvoice, 'items'>> & {
  id: string
  items?: NewInvoiceItem[]
}

export const bioTrackApi = createApi({
  reducerPath: 'bioTrackApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Transaction', 'Summary', 'Category', 'Customer', 'Invoice'],
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], TransactionFilter | undefined>({
      query: (filter) => buildQuery('/transactions', filter),
      providesTags: ['Transaction'],
      // Transform paginated response to just return data array for backwards compatibility
      transformResponse: (response: Transaction[] | PaginatedTransactionsResponse) => {
        // If response has pagination structure, extract data
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data
        }
        // Otherwise return as-is (backwards compatible)
        return response as Transaction[]
      },
    }),
    getPaginatedTransactions: builder.query<
      PaginatedTransactionsResponse,
      TransactionFilter & { cursor?: string; limit?: number } | undefined
    >({
      query: (filter) => buildPaginatedQuery('/transactions', filter),
      providesTags: ['Transaction'],
    }),
    addTransaction: builder.mutation<Transaction, NewTransaction>({
      query: (body) => ({
        url: '/transactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Transaction', 'Summary'],
    }),
    updateTransaction: builder.mutation<Transaction, UpdateTransaction>({
      query: ({ id, ...body }) => ({
        url: `/transactions/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Transaction', 'Summary'],
    }),
    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction', 'Summary'],
    }),
    getSummary: builder.query<TransactionSummary, TransactionFilter | undefined>({
      query: (filter) => buildQuery('/transactions/summary', filter),
      providesTags: ['Summary'],
    }),

    // ── Categories ──────────────────────────────────────────────────────────
    getCategories: builder.query<Category[], 'income' | 'expense' | undefined>({
      query: (type) => (type ? `/categories?type=${type}` : '/categories'),
      providesTags: ['Category'],
    }),
    addCategory: builder.mutation<Category, NewCategory>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<Category, UpdateCategory>({
      query: ({ id, name }) => ({ url: `/categories/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),

    // ── Customers ────────────────────────────────────────────────────────────
    getCustomers: builder.query<Customer[], void>({
      query: () => '/customers',
      providesTags: ['Customer'],
    }),
    addCustomer: builder.mutation<Customer, NewCustomer>({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation<Customer, UpdateCustomer>({
      query: ({ id, name }) => ({ url: `/customers/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    // ── Invoices ─────────────────────────────────────────────────────────────
    getInvoices: builder.query<Invoice[], { status?: InvoiceStatus } | undefined>({
      query: (filter) => filter?.status ? `/invoices?status=${filter.status}` : '/invoices',
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query<Invoice, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: ['Invoice'],
    }),
    addInvoice: builder.mutation<Invoice, NewInvoice>({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoice: builder.mutation<Invoice, UpdateInvoice>({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Invoice'],
    }),
    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invoice'],
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useGetPaginatedTransactionsQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetSummaryQuery,
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useAddInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = bioTrackApi

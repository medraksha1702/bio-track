import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Transaction } from '@/lib/data'
import type { TransactionFilter } from '@/lib/date-filters'

export type { TransactionFilter }

export type TransactionSummary = {
  totalIncome: number
  totalExpense: number
  profit: number
}

export type NewTransaction = {
  type: 'income' | 'expense'
  client: string
  category: string
  amount: number
  date: string
  notes?: string
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

export type Customer = { id: string; name: string; created_at: string }
export type NewCustomer = { name: string }
export type UpdateCustomer = { id: string; name: string }

function buildQuery(base: string, filter?: TransactionFilter): string {
  if (!filter?.startDate && !filter?.endDate) return base
  const sp = new URLSearchParams()
  if (filter.startDate) sp.set('startDate', filter.startDate)
  if (filter.endDate) sp.set('endDate', filter.endDate)
  return `${base}?${sp.toString()}`
}

export const bioTrackApi = createApi({
  reducerPath: 'bioTrackApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Transaction', 'Summary', 'Category', 'Customer'],
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], TransactionFilter | undefined>({
      query: (filter) => buildQuery('/transactions', filter),
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
  }),
})

export const {
  useGetTransactionsQuery,
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
} = bioTrackApi

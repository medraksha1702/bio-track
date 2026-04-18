// Dummy data for the MediLedger dashboard

export type Transaction = {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  client: string
  notes?: string
}

export type IncomeEntry = {
  id: string
  clientName: string
  category: string
  amount: number
  date: string
  notes: string
}

export type ExpenseEntry = {
  id: string
  vendor: string
  category: string
  amount: number
  date: string
  notes: string
}

export const incomeCategories = [
  'Medical Equipment Sales',
  'Laboratory Services',
  'Consultation Fees',
  'Research Grants',
  'Clinical Trials',
  'Training Services',
  'Software Licensing',
]

export const expenseCategories = [
  'Laboratory Supplies',
  'Equipment Maintenance',
  'Salaries',
  'Utilities',
  'Research & Development',
  'Marketing',
  'Insurance',
  'Office Supplies',
]

export const recentTransactions: Transaction[] = [
  {
    id: '1',
    date: '2026-04-14',
    type: 'income',
    category: 'Medical Equipment Sales',
    amount: 45000,
    client: 'Metro General Hospital',
  },
  {
    id: '2',
    date: '2026-04-13',
    type: 'expense',
    category: 'Laboratory Supplies',
    amount: 8500,
    client: 'BioSupply Co.',
  },
  {
    id: '3',
    date: '2026-04-12',
    type: 'income',
    category: 'Laboratory Services',
    amount: 12300,
    client: 'HealthFirst Clinic',
  },
  {
    id: '4',
    date: '2026-04-11',
    type: 'expense',
    category: 'Equipment Maintenance',
    amount: 3200,
    client: 'TechMed Services',
  },
  {
    id: '5',
    date: '2026-04-10',
    type: 'income',
    category: 'Clinical Trials',
    amount: 78000,
    client: 'PharmaCorp International',
  },
  {
    id: '6',
    date: '2026-04-09',
    type: 'expense',
    category: 'Salaries',
    amount: 42000,
    client: 'Internal',
  },
  {
    id: '7',
    date: '2026-04-08',
    type: 'income',
    category: 'Consultation Fees',
    amount: 5500,
    client: 'Regional Medical Center',
  },
  {
    id: '8',
    date: '2026-04-07',
    type: 'expense',
    category: 'Research & Development',
    amount: 15000,
    client: 'Internal',
  },
]

export const incomeData: IncomeEntry[] = [
  {
    id: '1',
    clientName: 'Metro General Hospital',
    category: 'Medical Equipment Sales',
    amount: 45000,
    date: '2026-04-14',
    notes: 'MRI Scanner units',
  },
  {
    id: '2',
    clientName: 'HealthFirst Clinic',
    category: 'Laboratory Services',
    amount: 12300,
    date: '2026-04-12',
    notes: 'Monthly diagnostic services',
  },
  {
    id: '3',
    clientName: 'PharmaCorp International',
    category: 'Clinical Trials',
    amount: 78000,
    date: '2026-04-10',
    notes: 'Phase 2 trial completion',
  },
  {
    id: '4',
    clientName: 'Regional Medical Center',
    category: 'Consultation Fees',
    amount: 5500,
    date: '2026-04-08',
    notes: 'Strategic planning consultation',
  },
  {
    id: '5',
    clientName: 'University Research Lab',
    category: 'Research Grants',
    amount: 125000,
    date: '2026-04-05',
    notes: 'NIH Grant Q2 disbursement',
  },
  {
    id: '6',
    clientName: 'BioTech Solutions',
    category: 'Software Licensing',
    amount: 8900,
    date: '2026-04-03',
    notes: 'Annual license renewal',
  },
]

export const expenseData: ExpenseEntry[] = [
  {
    id: '1',
    vendor: 'BioSupply Co.',
    category: 'Laboratory Supplies',
    amount: 8500,
    date: '2026-04-13',
    notes: 'Monthly reagent order',
  },
  {
    id: '2',
    vendor: 'TechMed Services',
    category: 'Equipment Maintenance',
    amount: 3200,
    date: '2026-04-11',
    notes: 'Quarterly maintenance contract',
  },
  {
    id: '3',
    vendor: 'Internal',
    category: 'Salaries',
    amount: 42000,
    date: '2026-04-09',
    notes: 'Bi-weekly payroll',
  },
  {
    id: '4',
    vendor: 'Internal',
    category: 'Research & Development',
    amount: 15000,
    date: '2026-04-07',
    notes: 'New protocol development',
  },
  {
    id: '5',
    vendor: 'PowerGrid Utilities',
    category: 'Utilities',
    amount: 4800,
    date: '2026-04-05',
    notes: 'Monthly electricity bill',
  },
  {
    id: '6',
    vendor: 'MedInsure Corp',
    category: 'Insurance',
    amount: 12500,
    date: '2026-04-02',
    notes: 'Liability insurance premium',
  },
]

// Summary stats
export const dashboardStats = {
  totalIncome: 274700,
  totalExpense: 86000,
  netProfit: 188700,
  pendingPayments: 32500,
}

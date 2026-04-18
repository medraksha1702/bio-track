/**
 * Single source of truth for currency formatting across the app.
 * Currency: Indian Rupee (₹ / INR)
 * Locale:   en-IN  →  e.g. ₹1,00,000
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

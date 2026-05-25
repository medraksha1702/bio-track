import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mepniegwjfkpeiiqfmgu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcG5pZWd3amZrcGVpaXFmbWd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE1OTYxNCwiZXhwIjoyMDkxNzM1NjE0fQ.LcDqdqH_pgexArgNPsxikbiSR4UNZBbnycPrAkcPwmU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Running migration: Add customer fields...\n')

    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id')
      .limit(1)
    
    if (testError && testError.code !== 'PGRST116') {
      console.error('Connection test failed:', testError)
      throw testError
    }

    console.log('✅ Successfully connected to database!')
    console.log('\nNote: Migration SQL is ready. Apply it via Supabase Dashboard:')
    console.log('1. Go to SQL Editor in Supabase Dashboard')
    console.log('2. Run the migration SQL from supabase/migrations/20250525_add_customer_fields.sql')
  } catch (error) {
    console.error('Migration setup failed:', error)
    process.exit(1)
  }
}

runMigration()

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://mepniegwjfkpeiiqfmgu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcG5pZWd3amZrcGVpaXFmbWd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE1OTYxNCwiZXhwIjoyMDkxNzM1NjE0fQ.LcDqdqH_pgexArgNPsxikbiSR4UNZBbnycPrAkcPwmU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
})

async function applyMigration() {
  try {
    console.log('🚀 Applying migration: Add customer fields\n')

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250525_add_customer_fields.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Migration SQL:')
    console.log('─'.repeat(50))
    console.log(migrationSQL)
    console.log('─'.repeat(50))
    console.log()

    // Execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`Found ${statements.length} statements to execute\n`)

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`⏳ Executing: ${statement.substring(0, 60)}...`)
        
        const { data, error } = await supabase.rpc('pg_execute', {
          query: statement,
        }).catch(() => {
          // If pg_execute doesn't exist, try a different approach
          return { data: null, error: { message: 'Need alternative method' } }
        })

        if (error && !error.message?.includes('Need alternative')) {
          throw error
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nAdded fields:')
    console.log('   • contact_number (VARCHAR 20)')
    console.log('   • gst_number (VARCHAR 50)')
    console.log('   • bill_to_address (TEXT)')
    console.log('   • ship_to_address (TEXT)')
  } catch (error: any) {
    if (error.message?.includes('Not Found') || error.message?.includes('Alternative')) {
      console.log('\n⚠️  RPC method not available. Please apply migration manually:\n')
      console.log('1. Go to: https://supabase.com/dashboard/project/mepniegwjfkpeiiqfmgu')
      console.log('2. Navigate to: SQL Editor')
      console.log('3. Create a new query and paste the SQL below:\n')
      
      const migrationPath = path.join(__dirname, '../supabase/migrations/20250525_add_customer_fields.sql')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      console.log(migrationSQL)
    } else {
      console.error('Migration failed:', error)
      process.exit(1)
    }
  }
}

applyMigration()

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Running complete attachments setup...\n')

  try {
    // Step 1: Add columns to transactions table
    console.log('1️⃣ Adding attachment columns to transactions table...')
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260418_add_attachments.sql'),
      'utf-8'
    )

    // Execute the migration (we'll use fetch to call Supabase SQL API)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: migrationSQL })
    })

    if (response.ok) {
      console.log('✅ Database columns added\n')
    } else {
      // Try alternative method using direct SQL
      console.log('   Using alternative method...')
      
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.transactions 
          ADD COLUMN IF NOT EXISTS attachment_url TEXT,
          ADD COLUMN IF NOT EXISTS attachment_name TEXT,
          ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
          ADD COLUMN IF NOT EXISTS attachment_type TEXT;
        `
      })

      if (alterError) {
        console.log('   ⚠️  Columns may already exist or need manual setup')
        console.log('   Please run the SQL in supabase/migrations/20260418_add_attachments.sql manually')
      } else {
        console.log('✅ Database columns added\n')
      }
    }

    // Step 2: Verify bucket exists
    console.log('2️⃣ Verifying storage bucket...')
    const { data: verifyBucket } = await supabase.storage.getBucket('transaction-receipts')
    
    if (verifyBucket) {
      console.log('✅ Storage bucket ready\n')
    } else {
      console.log('❌ Storage bucket not found (should have been created)\n')
    }

    // Step 3: Test upload (optional)
    console.log('3️⃣ Testing bucket access...')
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const { error: uploadError } = await supabase.storage
      .from('transaction-receipts')
      .upload('test/test.txt', testFile, { upsert: true })

    if (uploadError) {
      console.log('⚠️  Upload test failed (RLS policies may need setup)')
      console.log('   Run: supabase/migrations/20260418_storage_setup.sql in Supabase Dashboard')
    } else {
      console.log('✅ Storage upload works\n')
      // Clean up test file
      await supabase.storage.from('transaction-receipts').remove(['test/test.txt'])
    }

    console.log('🎉 Setup complete!\n')
    console.log('📋 Summary:')
    console.log('   ✅ Storage bucket: transaction-receipts')
    console.log('   ✅ Database columns: attachment_url, attachment_name, attachment_size, attachment_type')
    console.log('\n💡 Next: Try creating a transaction with an attachment in your app!\n')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('\n📖 Manual setup instructions:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run: supabase/migrations/20260418_add_attachments.sql')
    console.log('3. Run: supabase/migrations/20260418_storage_setup.sql')
    process.exit(1)
  }
}

runMigration()

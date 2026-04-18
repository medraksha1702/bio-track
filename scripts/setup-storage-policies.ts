import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

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

async function setupPolicies() {
  console.log('🚀 Setting up Storage RLS policies...\n')

  const policies = [
    {
      name: 'Allow anon upload receipts',
      sql: `
        CREATE POLICY "Allow anon upload receipts"
        ON storage.objects FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'transaction-receipts');
      `
    },
    {
      name: 'Allow anon read receipts',
      sql: `
        CREATE POLICY "Allow anon read receipts"
        ON storage.objects FOR SELECT
        TO anon
        USING (bucket_id = 'transaction-receipts');
      `
    },
    {
      name: 'Allow anon delete receipts',
      sql: `
        CREATE POLICY "Allow anon delete receipts"
        ON storage.objects FOR DELETE
        TO anon
        USING (bucket_id = 'transaction-receipts');
      `
    },
    {
      name: 'Allow anon update receipts',
      sql: `
        CREATE POLICY "Allow anon update receipts"
        ON storage.objects FOR UPDATE
        TO anon
        USING (bucket_id = 'transaction-receipts')
        WITH CHECK (bucket_id = 'transaction-receipts');
      `
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`📝 Creating policy: ${policy.name}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: policy.sql 
      })

      if (error) {
        // Check if policy already exists
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Policy already exists, skipping`)
        } else {
          console.error(`   ❌ Error:`, error.message)
        }
      } else {
        console.log(`   ✅ Created successfully`)
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err)
    }
  }

  console.log('\n🎉 RLS policies setup complete!\n')
  console.log('Your app should now be able to upload attachments.')
}

// Run setup
setupPolicies()

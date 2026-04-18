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

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for attachments...\n')

  try {
    // Step 1: Check if bucket exists
    console.log('1️⃣ Checking if bucket exists...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      throw listError
    }

    const bucketExists = buckets.some(b => b.name === 'transaction-receipts')

    if (bucketExists) {
      console.log('✅ Bucket "transaction-receipts" already exists\n')
    } else {
      // Step 2: Create bucket
      console.log('2️⃣ Creating bucket "transaction-receipts"...')
      const { data: bucket, error: createError } = await supabase.storage.createBucket('transaction-receipts', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      })

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message)
        throw createError
      }

      console.log('✅ Bucket created successfully\n')
    }

    // Step 3: Verify bucket
    console.log('3️⃣ Verifying bucket...')
    const { data: verifyBucket, error: getError } = await supabase.storage.getBucket('transaction-receipts')
    
    if (getError) {
      console.error('❌ Error verifying bucket:', getError.message)
      throw getError
    }

    console.log('✅ Bucket verified:')
    console.log(`   - Name: ${verifyBucket.name}`)
    console.log(`   - Public: ${verifyBucket.public}`)
    console.log(`   - File size limit: ${(verifyBucket.file_size_limit || 0) / 1024 / 1024}MB`)
    console.log()

    console.log('🎉 Storage setup complete!\n')
    console.log('Next steps:')
    console.log('1. Set up RLS policies (see supabase/migrations/20260418_storage_setup.sql)')
    console.log('2. Try uploading an attachment in your app\n')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run setup
setupStorage()

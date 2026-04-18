/**
 * MediLedger — Supabase Migration Script
 *
 * Runs schema + optional seed SQL directly against your Supabase project
 * using the Supabase Management API (no DB password required).
 *
 * Prerequisites:
 *   1. Create a Personal Access Token at:
 *      https://supabase.com/dashboard/account/tokens
 *   2. Add it to .env.local:
 *      SUPABASE_ACCESS_TOKEN=your_token_here
 *
 * Usage:
 *   npx tsx scripts/migrate.ts           # schema only
 *   npx tsx scripts/migrate.ts --seed    # schema + seed data
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!ACCESS_TOKEN) {
  console.error('\n❌  SUPABASE_ACCESS_TOKEN is not set in .env.local')
  console.error('    Create a token at: https://supabase.com/dashboard/account/tokens')
  console.error('    Then add it to .env.local:\n')
  console.error('    SUPABASE_ACCESS_TOKEN=your_token_here\n')
  process.exit(1)
}

if (!SUPABASE_URL) {
  console.error('\n❌  NEXT_PUBLIC_SUPABASE_URL is not set in .env.local\n')
  process.exit(1)
}

// Extract project ref from URL (https://xxxx.supabase.co → xxxx)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
const withSeed = process.argv.includes('--seed')

async function runSQL(label: string, sql: string): Promise<void> {
  console.log(`\n⏳  Running: ${label}`)

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`HTTP ${res.status}: ${errorText}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  console.log(`✅  Done: ${label}`)
}

async function main() {
  console.log(`\n🚀  MediLedger Migration`)
  console.log(`    Project: ${projectRef}`)
  console.log(`    Seed:    ${withSeed}`)

  const schemaSQL = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/schema.sql'),
    'utf-8'
  )

  await runSQL('Create transactions table + RLS policy', schemaSQL)

  if (withSeed) {
    const seedSQL = fs.readFileSync(
      path.resolve(process.cwd(), 'supabase/seed.sql'),
      'utf-8'
    )
    await runSQL('Insert seed data', seedSQL)
  }

  console.log('\n🎉  Migration complete!\n')
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err.message, '\n')
  process.exit(1)
})

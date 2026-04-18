/**
 * Creates the initial admin user in Supabase Auth via the Management API.
 * Usage:  npx tsx scripts/create-user.ts
 *
 * Requires SUPABASE_ACCESS_TOKEN in .env.local (already present).
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const PROJECT_REF = 'mepniegwjfkpeiiqfmgu'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const USER_EMAIL = 'kostikhushbu1234@gmail.com'
const USER_PASSWORD = 'Khushbu@1234'
const FULL_NAME = 'Khushbu Koshti'

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN not found in .env.local')
    process.exit(1)
  }

  console.log(`Creating user: ${USER_EMAIL} …`)

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: FULL_NAME },
      }),
    }
  )

  const body = await res.json() as Record<string, unknown>

  if (!res.ok) {
    // If the user already exists that's fine
    const msg = (body?.message ?? body?.error ?? JSON.stringify(body)) as string
    if (typeof msg === 'string' && msg.toLowerCase().includes('already')) {
      console.log('User already exists — nothing to do.')
    } else {
      console.error(`Failed (${res.status}):`, msg)
      process.exit(1)
    }
    return
  }

  console.log('User created successfully!')
  console.log(`  ID   : ${body.id}`)
  console.log(`  Email: ${body.email}`)
}

main()

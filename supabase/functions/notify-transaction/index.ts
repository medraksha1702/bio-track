/**
 * Edge Function: notify-transaction
 *
 * Triggered by a Supabase Database Webhook on INSERT into public.transactions.
 * For every auth user with prefs.emailNotifications = true, sends an email
 * confirming the new transaction.
 *
 * Setup (Supabase Dashboard → Database → Webhooks):
 *   Table:  public.transactions
 *   Events: INSERT
 *   URL:    https://<project-ref>.supabase.co/functions/v1/notify-transaction
 *   Method: POST
 *   Headers:
 *     Authorization: Bearer <SUPABASE_ANON_KEY>
 *     x-webhook-secret: <WEBHOOK_SECRET>   ← set same value in Edge Function secrets
 *
 * Required secrets (Supabase → Project → Edge Functions → Secrets):
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL       (optional)
 *   WEBHOOK_SECRET          (any random string you choose)
 *   NEXT_PUBLIC_APP_URL     (e.g. https://your-app.vercel.app)
 *   SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
 *   SUPABASE_URL               (auto-injected)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendEmail, fmtINR, fmtDate } from '../_shared/email.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// ─── Webhook payload type (Supabase DB webhook format) ────────────────────────

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: {
    id: string
    date: string
    type: 'income' | 'expense'
    category: string
    amount: number
    client: string
    notes?: string
    created_at: string
  }
  old_record: null | Record<string, unknown>
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildNotificationHtml(
  userName: string,
  tx: WebhookPayload['record'],
): string {
  const isIncome = tx.type === 'income'
  const typeColor = isIncome ? '#10B981' : '#EF4444'
  const typeBg = isIncome ? '#D1FAE5' : '#FEE2E2'
  const typeText = isIncome ? '#065F46' : '#991B1B'
  const amountPrefix = isIncome ? '+' : '-'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header stripe -->
    <div style="background:${typeColor};height:4px;"></div>

    <!-- Logo row -->
    <div style="padding:24px 28px 0;display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;background:#EEF2FF;border-radius:7px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#4F46E5;font-weight:700;font-size:16px;">B</span>
      </div>
      <span style="color:#1E293B;font-weight:700;font-size:15px;">BioTrack</span>
      <span style="margin-left:auto;background:${typeBg};color:${typeText};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;text-transform:capitalize;">
        ${tx.type} recorded
      </span>
    </div>

    <!-- Body -->
    <div style="padding:20px 28px 0;">
      <p style="margin:0;font-size:15px;color:#1E293B;font-weight:600;">Hi ${userName},</p>
      <p style="margin:8px 0 0;font-size:14px;color:#64748B;">
        A new ${tx.type} transaction was added to your account.
      </p>
    </div>

    <!-- Transaction card -->
    <div style="margin:20px 28px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:24px;font-weight:700;color:${typeColor};">${amountPrefix}${fmtINR(tx.amount)}</span>
        <span style="font-size:12px;color:#94A3B8;">${fmtDate(tx.date)}</span>
      </div>
      <div style="padding:12px 20px;">
        ${[
          ['Category', tx.category],
          ['Client / Vendor', tx.client],
          tx.notes ? ['Notes', tx.notes] : null,
        ]
          .filter(Boolean)
          .map(
            ([label, val]) =>
              `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F1F5F9;">
                 <span style="font-size:12px;color:#94A3B8;">${label}</span>
                 <span style="font-size:13px;color:#334155;font-weight:500;">${val}</span>
               </div>`,
          )
          .join('')}
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:0 28px 28px;text-align:center;">
      <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000'}/transactions"
         style="display:inline-block;background:#4F46E5;color:#FFF;text-decoration:none;
                padding:11px 24px;border-radius:8px;font-size:13px;font-weight:600;">
        View all transactions →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC;padding:14px 28px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">
        Email notifications are enabled in your BioTrack settings.
        <br>To unsubscribe, go to Settings → Notifications and turn off Email Notifications.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Verify webhook secret
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
  if (webhookSecret) {
    const incoming = req.headers.get('x-webhook-secret')
    if (incoming !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Only handle INSERT events
  if (payload.type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true, reason: 'not an INSERT' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tx = payload.record

  // Get all users with emailNotifications enabled
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    return new Response(JSON.stringify({ error: usersError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const opted = users.filter(
    (u) => u.user_metadata?.prefs?.emailNotifications === true,
  )

  if (opted.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No users opted in to email notifications' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const results = await Promise.all(
    opted.map(async (user) => {
      const fullName: string = user.user_metadata?.full_name ?? user.email ?? 'there'
      const firstName = fullName.split(/[\s@]/)[0]
      const html = buildNotificationHtml(firstName, tx)
      const result = await sendEmail({
        to: user.email!,
        subject: `${tx.type === 'income' ? '💚' : '🔴'} ${tx.type === 'income' ? '+' : '-'}${fmtINR(tx.amount)} — ${tx.category}`,
        html,
      })
      return { email: user.email, ...result }
    }),
  )

  return new Response(
    JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

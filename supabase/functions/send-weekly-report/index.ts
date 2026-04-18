/**
 * Edge Function: send-weekly-report
 *
 * Triggered every Monday at 08:00 UTC via pg_cron (see migrations).
 * For every auth user who has prefs.weeklyReports = true, fetches the last
 * 7 days of transactions and emails a formatted summary via Resend.
 *
 * Required secrets (Supabase → Project → Edge Functions → Secrets):
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL   (optional, defaults to onboarding@resend.dev)
 *   SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
 *   SUPABASE_URL               (auto-injected by Supabase)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendEmail, fmtINR, fmtDate } from '../_shared/email.ts'

// ─── Supabase admin client (service role) ────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// ─── Date window ─────────────────────────────────────────────────────────────

function lastSevenDays(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

interface Transaction {
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  client: string
  notes?: string
}

function buildEmailHtml(
  userName: string,
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): string {
  const income = transactions.filter((t) => t.type === 'income')
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpense
  const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'

  const profitColor = netProfit >= 0 ? '#10B981' : '#EF4444'

  const txRows = transactions
    .slice(0, 15) // cap at 15 rows in email
    .map(
      (t) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;">${fmtDate(t.date)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:13px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
            background:${t.type === 'income' ? '#D1FAE5' : '#FEE2E2'};
            color:${t.type === 'income' ? '#065F46' : '#991B1B'};">
            ${t.type}
          </span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#1E293B;font-size:13px;">${t.category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#475569;font-size:13px;">${t.client}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;text-align:right;font-size:13px;font-weight:600;
            color:${t.type === 'income' ? '#10B981' : '#EF4444'};">
          ${t.type === 'income' ? '+' : '-'}${fmtINR(t.amount)}
        </td>
      </tr>`,
    )
    .join('')

  const moreRows =
    transactions.length > 15
      ? `<tr><td colspan="5" style="padding:10px 12px;color:#94A3B8;font-size:12px;text-align:center;">
           + ${transactions.length - 15} more transactions — log in to view all
         </td></tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#4F46E5;padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#FFF;font-weight:700;font-size:18px;">B</span>
        </div>
        <div>
          <div style="color:#FFF;font-weight:700;font-size:18px;">BioTrack</div>
          <div style="color:rgba(255,255,255,0.7);font-size:12px;">Weekly Financial Summary</div>
        </div>
      </div>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 0;">
      <p style="margin:0;font-size:16px;font-weight:600;color:#1E293B;">Hi ${userName} 👋</p>
      <p style="margin:8px 0 0;font-size:14px;color:#64748B;">
        Here's your financial summary for <strong>${fmtDate(startDate)}</strong> – <strong>${fmtDate(endDate)}</strong>.
      </p>
    </div>

    <!-- KPI Cards -->
    <div style="padding:20px 32px;display:flex;gap:16px;">
      <div style="flex:1;background:#F0FDF4;border-radius:10px;padding:16px;">
        <div style="font-size:11px;font-weight:600;color:#16A34A;text-transform:uppercase;letter-spacing:0.05em;">Total Income</div>
        <div style="font-size:22px;font-weight:700;color:#15803D;margin-top:4px;">${fmtINR(totalIncome)}</div>
        <div style="font-size:12px;color:#86EFAC;margin-top:2px;">${income.length} transaction${income.length !== 1 ? 's' : ''}</div>
      </div>
      <div style="flex:1;background:#FFF1F2;border-radius:10px;padding:16px;">
        <div style="font-size:11px;font-weight:600;color:#DC2626;text-transform:uppercase;letter-spacing:0.05em;">Total Expenses</div>
        <div style="font-size:22px;font-weight:700;color:#B91C1C;margin-top:4px;">${fmtINR(totalExpense)}</div>
        <div style="font-size:12px;color:#FCA5A5;margin-top:2px;">${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}</div>
      </div>
      <div style="flex:1;background:#F5F3FF;border-radius:10px;padding:16px;">
        <div style="font-size:11px;font-weight:600;color:#7C3AED;text-transform:uppercase;letter-spacing:0.05em;">Net Profit</div>
        <div style="font-size:22px;font-weight:700;color:${profitColor};margin-top:4px;">${fmtINR(netProfit)}</div>
        <div style="font-size:12px;color:#C4B5FD;margin-top:2px;">Margin ${margin}%</div>
      </div>
    </div>

    <!-- Transactions table -->
    ${
      transactions.length > 0
        ? `
    <div style="padding:0 32px 28px;">
      <p style="font-size:13px;font-weight:600;color:#1E293B;margin:0 0 12px;">Transactions this week</p>
      <table style="width:100%;border-collapse:collapse;background:#FAFAFA;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
        <thead>
          <tr style="background:#F1F5F9;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Date</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Type</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Category</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Client</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${txRows}
          ${moreRows}
        </tbody>
      </table>
    </div>`
        : `<div style="padding:0 32px 28px;text-align:center;color:#94A3B8;font-size:14px;">
             No transactions recorded this week.
           </div>`
    }

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000'}"
         style="display:inline-block;background:#4F46E5;color:#FFF;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
        View full dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC;padding:16px 32px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">
        You're receiving this because weekly reports are enabled in your BioTrack settings.
        <br>To unsubscribe, go to Settings → Notifications and turn off Weekly Reports.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  try {
    // List all auth users (admin API)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    // Filter users who opted in to weekly reports
    const opted = users.filter(
      (u) => u.user_metadata?.prefs?.weeklyReports === true,
    )

    if (opted.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with weekly reports enabled' }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { startDate, endDate } = lastSevenDays()

    // Fetch transactions for the week (shared table — all users see same data)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (txError) throw txError

    // Send email to each opted-in user
    const results = await Promise.all(
      opted.map(async (user) => {
        const fullName: string = user.user_metadata?.full_name ?? user.email ?? 'there'
        const firstName = fullName.split(/[\s@]/)[0]
        const html = buildEmailHtml(firstName, transactions ?? [], startDate, endDate)
        const result = await sendEmail({
          to: user.email!,
          subject: `📊 Your weekly financial summary — ${fmtDate(endDate)}`,
          html,
        })
        return { email: user.email, ...result }
      }),
    )

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

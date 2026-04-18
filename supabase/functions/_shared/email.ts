/**
 * Shared email sender via Resend.
 * Set RESEND_API_KEY in Supabase → Project → Edge Functions → Secrets.
 * Set RESEND_FROM_EMAIL to e.g. "BioTrack <reports@yourdomain.com>"
 */

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'BioTrack <onboarding@resend.dev>'

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: body }
  }
  return { ok: true }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmtINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

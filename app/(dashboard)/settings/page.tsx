'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User as UserIcon,
  Bell,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  Clock,
  Mail,
  Building2,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { useGetTransactionsQuery } from '@/lib/services/api'
import { transactionsToCsv, downloadTextFile } from '@/lib/export-csv'
import { CategoriesCard } from '@/components/categories-card'
import { CustomersCard } from '@/components/customers-card'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileFields = {
  firstName: string
  lastName: string
  email: string
  organization: string
}

/** Stored verbatim in user_metadata.prefs — keep flat and serialisable */
type Prefs = {
  emailNotifications: boolean
  weeklyReports: boolean
  fiscalYearStart: string
}

const DEFAULT_PREFS: Prefs = {
  emailNotifications: false,
  weeklyReports: false,
  fiscalYearStart: 'january',
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string, email: string) {
  if (first || last) return [first[0], last[0]].filter(Boolean).join('').toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function fmt(iso: string | undefined, includeTime = false) {
  if (!iso) return '—'
  return format(
    new Date(iso),
    includeTime ? 'dd MMM yyyy, HH:mm' : 'dd MMM yyyy',
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const [profile, setProfile] = useState<ProfileFields>({
    firstName: '',
    lastName: '',
    email: '',
    organization: '',
  })
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [profileDirty, setProfileDirty] = useState(false)
  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle')
  const [profileError, setProfileError] = useState('')

  const { data: allTransactions = [], isFetching: exportLoading } =
    useGetTransactionsQuery(undefined)

  // ── Bootstrap: load from Supabase user_metadata ───────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUser(user)

      const meta = user.user_metadata ?? {}
      const fullName: string = meta.full_name ?? ''
      const parts = fullName.trim().split(/\s+/)

      setProfile({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
        email: user.email ?? '',
        organization: meta.organization ?? '',
      })

      setPrefs({ ...DEFAULT_PREFS, ...(meta.prefs ?? {}) })
      setHydrated(true)
    })
  }, [])

  // ── Profile save → Supabase ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileStatus('saving')
    setProfileError('')
    const supabase = createClient()
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName || undefined, organization: profile.organization || undefined },
    })
    if (error) {
      setProfileStatus('error')
      setProfileError(error.message)
    } else {
      setProfileStatus('saved')
      setProfileDirty(false)
      setTimeout(() => setProfileStatus('idle'), 3000)
    }
  }

  const updateProfile = useCallback((partial: Partial<ProfileFields>) => {
    setProfile((p) => ({ ...p, ...partial }))
    setProfileDirty(true)
    setProfileStatus('idle')
  }, [])

  // ── Prefs save → Supabase (auto on toggle) ────────────────────────────────
  const updatePrefs = useCallback(async (partial: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial }
      // Fire-and-forget — save to Supabase in the background
      createClient()
        .auth.updateUser({ data: { prefs: next } })
        .catch(console.error)
      return next
    })
  }, [])

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportAll = () => {
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const csv = transactionsToCsv(allTransactions)
    downloadTextFile(`bio-track-transactions_all_${stamp}.csv`, csv)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader title="Settings" description="Manage your account and preferences" />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  const initials = getInitials(profile.firstName, profile.lastName, profile.email)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Settings"
        description="Profile and preferences — all saved to your Supabase account"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-3xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >

          {/* ── Account Info ─────────────────────────────────────────── */}
          {user && (
            <motion.div variants={staggerItem}>
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold">
                        {[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
                          profile.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    <Badge className="shrink-0 bg-emerald-100 text-emerald-700 text-xs">
                      Active
                    </Badge>
                  </div>
                  <Separator className="my-4 bg-border/40" />
                  <div className="grid gap-3 text-xs sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>Joined {fmt(user.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Last seen {fmt(user.last_sign_in_at, true)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Profile Settings ──────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <UserIcon className="h-4 w-4 text-primary" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-base font-semibold">Profile</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Saved to your account — syncs across all devices
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => updateProfile({ firstName: e.target.value })}
                        placeholder="Khushbu"
                        className="h-9 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => updateProfile({ lastName: e.target.value })}
                        placeholder="Koshti"
                        className="h-9 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Input
                        value={profile.email}
                        readOnly
                        className="h-9 cursor-not-allowed border-border/60 bg-muted/50 pr-20 text-sm text-muted-foreground"
                      />
                      <Badge
                        variant="secondary"
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
                      >
                        read-only
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Email is managed by your Supabase authentication account.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org" className="text-xs font-medium text-muted-foreground">
                      <Building2 className="mr-1 inline h-3 w-3" />
                      Organisation / Clinic
                    </Label>
                    <Input
                      id="org"
                      value={profile.organization}
                      onChange={(e) => updateProfile({ organization: e.target.value })}
                      placeholder="e.g. Metro General Hospital"
                      className="h-9 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        type="button"
                        className="h-9 min-w-32 text-sm font-medium"
                        onClick={handleSaveProfile}
                        disabled={profileStatus === 'saving' || !profileDirty}
                      >
                        {profileStatus === 'saving' ? (
                          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                        ) : (
                          'Save Profile'
                        )}
                      </Button>
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {profileStatus === 'saved' && (
                        <motion.div
                          key="saved"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-xs text-emerald-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Saved to your account
                        </motion.div>
                      )}
                      {profileStatus === 'error' && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-xs text-destructive"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          {profileError || 'Something went wrong'}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* ── Notifications & Preferences ───────────────────────────── */}
          <motion.div variants={staggerItem}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Bell className="h-4 w-4 text-primary" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Notifications &amp; Preferences
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Auto-saved to your account — syncs across all devices
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Email Notifications toggle */}
                  <motion.div
                    className="flex items-start justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/30"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Transaction Email Alerts</Label>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Live</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Receive an email confirmation each time a new income or expense is recorded.
                        Powered by the <code className="text-[11px]">notify-transaction</code> edge function.
                      </p>
                    </div>
                    <Switch
                      checked={prefs.emailNotifications}
                      onCheckedChange={(v) => updatePrefs({ emailNotifications: v })}
                    />
                  </motion.div>

                  {/* Weekly Reports toggle */}
                  <motion.div
                    className="flex items-start justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/30"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Weekly Financial Summary</Label>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Live</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Every Monday at 08:00 UTC you'll receive a formatted email with last week's
                        income, expenses, net profit, and transaction list.
                        Powered by the <code className="text-[11px]">send-weekly-report</code> edge function + pg_cron.
                      </p>
                    </div>
                    <Switch
                      checked={prefs.weeklyReports}
                      onCheckedChange={(v) => updatePrefs({ weeklyReports: v })}
                    />
                  </motion.div>

                  <Separator className="bg-border/40" />

                  {/* Fiscal year */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Fiscal Year Start
                    </Label>
                    <Select
                      value={prefs.fiscalYearStart}
                      onValueChange={(v) => updatePrefs({ fiscalYearStart: v })}
                    >
                      <SelectTrigger className="h-9 w-48 border-border/60 bg-muted/30 text-sm focus:ring-2 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {(['january', 'april', 'july', 'october'] as const).map((m) => (
                          <SelectItem key={m} value={m} className="text-sm capitalize">
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Used for fiscal-period calculations in reports.
                    </p>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* ── Categories ───────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <CategoriesCard />
          </motion.div>

          {/* ── Customers ────────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <CustomersCard />
          </motion.div>

          {/* ── Data & Export ─────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card className="border-destructive/30 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Shield className="h-4 w-4 text-destructive" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-base font-semibold text-destructive">
                        Data &amp; Export
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Download all transactions — account data is stored in Supabase
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div
                    className="flex items-center justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/30"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Export all transactions</p>
                        <p className="text-xs text-muted-foreground">
                          Download every transaction as CSV — includes summary section
                        </p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-border/60 text-xs"
                        disabled={exportLoading || allTransactions.length === 0}
                        onClick={handleExportAll}
                      >
                        {exportLoading ? 'Loading…' : 'Export CSV'}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Account data</p>
                        <p className="text-xs text-muted-foreground">
                          Your profile and preferences are stored in Supabase and persist across devices.
                          To delete your account, contact your administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  )
}

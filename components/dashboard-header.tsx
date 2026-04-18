'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Command, TrendingUp, TrendingDown, CheckCheck } from 'lucide-react'
import { format, parseISO, subDays } from 'date-fns'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { fadeInUp } from '@/lib/animations'
import { createClient } from '@/lib/supabase/client'
import { useGetTransactionsQuery } from '@/lib/services/api'
import { formatCurrency } from '@/lib/format-currency'

interface DashboardHeaderProps {
  title: string
  description?: string
}

function getInitials(raw: string) {
  return raw
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join('')
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const [initials, setInitials] = useState('··')
  const [fullName, setFullName] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  // ── Fetch real user for initials ─────────────────────────────────────────
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) return
        const raw = user.user_metadata?.full_name ?? user.email ?? ''
        setFullName(user.user_metadata?.full_name ?? (user.email?.split('@')[0] ?? ''))
        setInitials(getInitials(raw) || 'U')
      })
  }, [])

  // ── Fetch recent transactions for notifications ───────────────────────────
  const { data: allTransactions = [] } = useGetTransactionsQuery(undefined)

  // Show the 5 most recent transactions added in the last 30 days as "activity"
  const cutoff = subDays(new Date(), 30)
  const recentActivity = allTransactions
    .filter((t) => parseISO(t.date) >= cutoff)
    .slice(0, 5)

  const unreadCount = Math.min(recentActivity.length, 9)

  return (
    <motion.header
      className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 md:px-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── Left: title ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </motion.div>
      </div>

      {/* ── Right: search + bell + avatar ────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-56 rounded-lg border-border/60 bg-muted/40 pl-9 pr-12 text-sm placeholder:text-muted-foreground/60 transition-all duration-200 focus-visible:w-64 focus-visible:ring-1 focus-visible:ring-ring/30"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        {/* Bell — recent transactions as activity feed */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-lg hover:bg-muted/60"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.4 }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 rounded-xl p-1">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Recent Activity
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2" />

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                <CheckCheck className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No recent transactions</p>
              </div>
            ) : (
              recentActivity.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  className="flex items-start gap-3 rounded-lg p-3 focus:bg-muted/60"
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white',
                      t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                  >
                    {t.type === 'income' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium capitalize">{t.category}</span>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-semibold',
                          t.type === 'income' ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.client} · {format(parseISO(t.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar — real user initials */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground ring-2 ring-background"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {initials}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {fullName || initials}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </motion.header>
  )
}

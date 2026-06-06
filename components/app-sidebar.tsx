'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Receipt,
  ChevronRight,
  Users,
  Tags,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { signOut } from '@/app/actions/auth'

const menuItems = [
  { title: 'Dashboard',    url: '/',             icon: LayoutDashboard },
  { title: 'Income',       url: '/income',        icon: TrendingUp      },
  { title: 'Expenses',     url: '/expenses',      icon: TrendingDown    },
  { title: 'Transactions', url: '/transactions',  icon: ArrowLeftRight  },
  { title: 'Billing',      url: '/billing',       icon: Receipt         },
  { title: 'Reports',      url: '/reports',       icon: BarChart3       },
]

const settingsSubItems = [
  { title: 'Customers',  url: '/settings/customers',  icon: Users },
  { title: 'Categories', url: '/settings/categories', icon: Tags  },
]

interface AppSidebarProps {
  userName: string
  userEmail: string
  userInitials: string
}

export function AppSidebar({ userName, userEmail, userInitials }: AppSidebarProps) {
  const pathname = usePathname()
  const isSettingsSection = pathname.startsWith('/settings')
  const [settingsOpen, setSettingsOpen] = useState(isSettingsSection)

  // Auto-expand the Settings submenu when navigating into any settings route.
  useEffect(() => {
    if (isSettingsSection) setSettingsOpen(true)
  }, [isSettingsSection])

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="group flex items-center gap-3">
          <motion.div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 p-0.5"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Image
              src="/logo.png"
              alt="k² Biomedical"
              width={36}
              height={36}
              className="h-full w-full rounded object-contain"
              priority
            />
          </motion.div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
              k² Biomedical
            </span>
            <span className="text-[11px] text-muted-foreground">Finance Tracking</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.url
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`h-9 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <Link href={item.url} className="relative flex items-center gap-3">
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                className="absolute -left-3 h-5 w-1 rounded-r-full bg-primary"
                                layoutId="activeIndicator"
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                          </AnimatePresence>
                          <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`}
                            />
                          </motion.div>
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                )
              })}

              {/* ── Settings (with submenu) ──────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: menuItems.length * 0.05 }}
              >
                <Collapsible
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/settings'}
                      tooltip="Settings"
                      className={`h-9 rounded-lg transition-all duration-200 ${
                        pathname === '/settings'
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Link href="/settings" className="relative flex items-center gap-3">
                        <AnimatePresence>
                          {pathname === '/settings' && (
                            <motion.div
                              className="absolute -left-3 h-5 w-1 rounded-r-full bg-primary"
                              layoutId="activeIndicator"
                              initial={{ opacity: 0, scaleY: 0 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              exit={{ opacity: 0, scaleY: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </AnimatePresence>
                        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                          <Settings
                            className={`h-4 w-4 shrink-0 ${pathname === '/settings' ? 'text-primary' : ''}`}
                          />
                        </motion.div>
                        <span className="text-sm">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle Settings submenu</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-1">
                        {settingsSubItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === sub.url}
                            >
                              <Link href={sub.url}>
                                <sub.icon className="h-4 w-4 shrink-0" />
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </motion.div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User footer ──────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <motion.div
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {/* Avatar */}
          <motion.div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground ring-2 ring-background"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {userInitials}
          </motion.div>

          {/* Name + email */}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium capitalize text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
          </div>

          {/* Sign-out button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <form action={signOut} className="group-data-[collapsible=icon]:hidden">
                <button
                  type="submit"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Sign out
            </TooltipContent>
          </Tooltip>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  )
}

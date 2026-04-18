import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Belt-and-suspenders: middleware already redirects, but guard here too
  if (!user) redirect('/login')

  const rawName: string = user.user_metadata?.full_name ?? user.email ?? 'User'
  const initials = rawName
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <SidebarProvider>
      <AppSidebar
        userName={rawName.includes('@') ? rawName.split('@')[0] : rawName}
        userEmail={user.email ?? ''}
        userInitials={initials}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

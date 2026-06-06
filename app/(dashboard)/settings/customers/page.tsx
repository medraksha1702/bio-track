'use client'

import { motion } from 'framer-motion'
import { Users, Phone, FileText } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { CustomersTable } from '@/components/customers-table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetCustomersQuery } from '@/lib/services/api'
import { staggerContainer, staggerItem } from '@/lib/animations'

export default function CustomersSettingsPage() {
  const { data: customers = [], isLoading } = useGetCustomersQuery()

  const cards = [
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'With Contact',
      value: customers.filter((c) => c.contact_number).length,
      icon: Phone,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'With GST Number',
      value: customers.filter((c) => c.gst_number).length,
      icon: FileText,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader title="Customers" description="Manage your customer directory" />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Summary cards */}
          <motion.div className="grid gap-4 sm:grid-cols-3" variants={staggerItem}>
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
              >
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {card.title}
                          </p>
                          {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                          ) : (
                            <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                          )}
                        </div>
                        <div className={`rounded-xl p-2.5 ${card.bgColor}`}>
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Table */}
          <motion.div variants={staggerItem}>
            <CustomersTable />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

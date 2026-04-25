'use client'

import AppShell from '@/components/app-shell'
import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <div className="flex flex-col items-center justify-center py-20 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Reports & Analytics
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Advanced analytics and reporting coming soon. Export insights about
          your contacts and deals.
        </p>
      </div>
    </AppShell>
  )
}

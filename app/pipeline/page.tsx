'use client'

import AppShell from '@/components/app-shell'
import { GitBranch } from 'lucide-react'

export default function PipelinePage() {
  return (
    <AppShell title="Pipeline">
      <div className="flex flex-col items-center justify-center py-20 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
          <GitBranch className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Pipeline View
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Kanban-style deal pipeline coming soon. Track deals through stages
          from lead to close.
        </p>
      </div>
    </AppShell>
  )
}

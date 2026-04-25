'use client'

import AppShell from '@/components/app-shell'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="flex flex-col items-center justify-center py-20 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Account settings, team management, and integrations coming soon.
        </p>
      </div>
    </AppShell>
  )
}

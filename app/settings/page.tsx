'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import AppShell from '@/components/app-shell'
import ConfirmDialog from '@/components/confirm-dialog'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import {
  User,
  Mail,
  Shield,
  Pencil,
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Zap,
  Palette,
  Database,
  Info,
} from 'lucide-react'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  /* ---- Export all contacts as CSV ---- */
  const handleExportAll = async () => {
    setExporting(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      setExporting(false)
      return
    }

    const contacts = data as Contact[]
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Last Contacted', 'Created At']
    const escape = (v: string) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }
    const rows = contacts.map((c) =>
      [c.name, c.email, c.phone, c.company, c.status, c.deal_value, c.last_contacted, c.created_at]
        .map((v) => escape(String(v ?? '')))
        .join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexcrm-all-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  /* ---- Clear all contacts ---- */
  const handleClearAll = async () => {
    setClearing(true)
    // Delete all rows — Supabase requires a filter, so we use gte on id
    await supabase.from('contacts').delete().gte('id', '00000000-0000-0000-0000-000000000000')
    setClearing(false)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const cardClass = 'bg-card border border-border rounded-2xl p-6'
  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-3 mb-5">
      {icon}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  )

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-5 fade-in">

        {/* ===== SECTION 1 — Profile ===== */}
        <div className={cardClass}>
          {sectionTitle(
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-500" />
            </div>,
            'Profile'
          )}

          <div className="space-y-4">
            {[
              { label: 'Display Name', value: 'CRM Admin', icon: User },
              { label: 'Email', value: 'admin@nexcrm.com', icon: Mail },
              { label: 'Role', value: 'Administrator', icon: Shield },
            ].map((field) => {
              const Icon = field.icon
              return (
                <div key={field.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-medium text-foreground">{field.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <button
              disabled
              title="Coming soon"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ===== SECTION 2 — Appearance ===== */}
        <div className={cardClass}>
          {sectionTitle(
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-500" />
            </div>,
            'Appearance'
          )}

          {mounted && (
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`
                      relative flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <Icon className="w-5 h-5" />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== SECTION 3 — Data Management ===== */}
        <div className={cardClass}>
          {sectionTitle(
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-500" />
            </div>,
            'Data'
          )}

          <div className="space-y-3">
            {/* Export */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40">
              <div>
                <p className="text-sm font-medium text-foreground">Export All Contacts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download every contact as a CSV file</p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 active:scale-95"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>

            {/* Clear */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-sm font-medium text-foreground">Clear All Contacts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete every contact from the database</p>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>

        {/* ===== SECTION 4 — About ===== */}
        <div className={cardClass}>
          {sectionTitle(
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-amber-500" />
            </div>,
            'About NexCRM'
          )}

          <div className="space-y-3">
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Framework', value: 'Next.js 16 (App Router)' },
              { label: 'Database', value: 'Supabase (PostgreSQL)' },
              { label: 'Styling', value: 'Tailwind CSS v4' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">NexCRM</p>
              <p className="text-xs text-muted-foreground">Modern CRM Dashboard</p>
            </div>
            <a
              href="https://github.com/Shashidhar-Pawadashetti/crm-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>

      </div>

      {/* Confirm clear dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Clear All Contacts"
        message="This will permanently delete ALL contacts from your database. This action cannot be undone. Are you sure?"
      />
    </AppShell>
  )
}

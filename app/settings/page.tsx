'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  Database,
  Download,
  ExternalLink,
  Info,
  Mail,
  Monitor,
  Moon,
  Pencil,
  Shield,
  Sun,
  Trash2,
  User,
} from 'lucide-react'
import AppShell from '@/components/app-shell'
import ConfirmDialog from '@/components/confirm-dialog'
import { useTheme } from '@/components/theme-provider'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import {
  formatDatabaseError,
  formatSupabaseConfigurationError,
} from '@/lib/db-error'

type ThemeOption = 'light' | 'dark' | 'system'

const THEME_OPTIONS: {
  value: ThemeOption
  label: string
  icon: typeof Sun
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? '')
  return stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue
}

function SectionCard({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string
  icon: typeof User
  iconClassName: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  const { theme, resolvedTheme, mounted, setTheme } = useTheme()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeThemeLabel = useMemo(() => {
    if (!mounted) return 'Loading...'
    if (theme === 'system') {
      return `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
    }
    return theme === 'dark' ? 'Dark' : 'Light'
  }, [mounted, resolvedTheme, theme])

  const handleExportAll = async () => {
    setExporting(true)
    setError(null)
    if (!supabase) {
      setError(formatSupabaseConfigurationError('export contacts'))
      setExporting(false)
      return
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      setError(formatDatabaseError(error, 'export contacts'))
      setExporting(false)
      return
    }

    const contacts = data as Contact[]
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Deal Value',
      'Last Contacted',
      'Created At',
    ]
    const rows = contacts.map((contact) =>
      [
        contact.name,
        contact.email,
        contact.phone,
        contact.company,
        contact.status,
        contact.deal_value,
        contact.last_contacted,
        contact.created_at,
      ]
        .map(escapeCsv)
        .join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nexcrm-all-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleClearAll = async () => {
    setClearing(true)
    setError(null)
    if (!supabase) {
      setError(formatSupabaseConfigurationError('clear all contacts'))
      setClearing(false)
      return
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .not('id', 'is', null)

    if (error) {
      setError(formatDatabaseError(error, 'clear all contacts'))
    }

    setClearing(false)
  }

  return (
    <AppShell title="Settings">
      <div className="w-full space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <SectionCard
          title="Profile"
          icon={User}
          iconClassName="bg-indigo-500/10 text-indigo-500"
        >
          <div className="space-y-4">
            {[
              { label: 'Display Name', value: 'CRM Admin', icon: User },
              { label: 'Email', value: 'admin@nexcrm.com', icon: Mail },
              { label: 'Role', value: 'Administrator', icon: Shield },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <button
              disabled
              title="Coming soon"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Appearance"
          icon={Sun}
          iconClassName="bg-purple-500/10 text-purple-500"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {mounted &&
                THEME_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isSelected = theme === option.value

                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      aria-pressed={isSelected}
                      className={`relative flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4 ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-medium">{option.label}</span>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Active theme:{' '}
              <span className="font-medium text-foreground">{activeThemeLabel}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Data"
          icon={Database}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-4 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Export All Contacts</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Download every contact as a CSV file.
                </p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-red-500/10 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Clear All Contacts</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Permanently delete every contact from the database.
                </p>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={clearing}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="About NexCRM"
          icon={Info}
          iconClassName="bg-amber-500/10 text-amber-500"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              Built with Next.js 16 + Supabase + Tailwind CSS v4
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <a
              href="https://github.com/Shashidhar-Pawadashetti/crm-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Clear All Contacts"
        message="This will permanently delete all contacts from the database. This action cannot be undone."
      />
    </AppShell>
  )
}

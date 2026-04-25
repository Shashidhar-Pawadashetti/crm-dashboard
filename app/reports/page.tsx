'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppShell from '@/components/app-shell'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import {
  Download,
  Trophy,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Target,
  IndianRupee,
  Percent,
  Zap,
} from 'lucide-react'

type Status = Contact['status']

const statusMeta: Record<Status, { color: string; bar: string; bg: string }> = {
  Lead:     { color: 'text-blue-600 dark:text-blue-400',    bar: 'bg-blue-500',    bg: 'bg-blue-500/10' },
  Active:   { color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  Inactive: { color: 'text-slate-500 dark:text-slate-400',  bar: 'bg-slate-400',   bg: 'bg-slate-400/10' },
  Churned:  { color: 'text-red-600 dark:text-red-400',      bar: 'bg-red-500',     bg: 'bg-red-500/10' },
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L'
  return '₹' + value.toLocaleString('en-IN')
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

/* ---------- skeletons ---------- */

function SkeletonBar({ w }: { w: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="skeleton h-4 w-16 rounded" />
      <div className="flex-1 h-7 rounded-lg overflow-hidden bg-muted">
        <div className="skeleton h-full rounded-lg" style={{ width: `${w}%` }} />
      </div>
      <div className="skeleton h-4 w-10 rounded" />
    </div>
  )
}

function SkeletonSection({ lines, className = '' }: { lines: number; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-5 w-36 rounded mb-5" />
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <div className="skeleton h-4 rounded" style={{ width: `${50 + (i * 17) % 40}%` }} />
        </div>
      ))}
    </div>
  )
}

/* ---------- page ---------- */

export default function ReportsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else if (data) {
      setContacts(data as Contact[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  /* ---- computed analytics ---- */

  const total = contacts.length

  const statusCounts = useMemo(() => {
    const map: Record<Status, number> = { Lead: 0, Active: 0, Inactive: 0, Churned: 0 }
    for (const c of contacts) if (map[c.status] !== undefined) map[c.status]++
    return map
  }, [contacts])

  const top5 = useMemo(
    () =>
      [...contacts]
        .sort((a, b) => (Number(b.deal_value) || 0) - (Number(a.deal_value) || 0))
        .slice(0, 5),
    [contacts]
  )

  const summaryStats = useMemo(() => {
    if (total === 0)
      return { avg: 0, highest: 0, activePipeline: 0, conversion: 0 }

    const values = contacts.map((c) => Number(c.deal_value) || 0)
    const avg = values.reduce((a, b) => a + b, 0) / total
    const highest = Math.max(...values)
    const activePipeline = contacts
      .filter((c) => c.status === 'Active')
      .reduce((s, c) => s + (Number(c.deal_value) || 0), 0)
    const conversion = (statusCounts.Active / total) * 100

    return { avg, highest, activePipeline, conversion }
  }, [contacts, total, statusCounts])

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { label: string; count: number; key: string }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ label: getMonthLabel(d), count: 0, key })
    }

    for (const c of contacts) {
      if (!c.created_at) continue
      const d = new Date(c.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const m = months.find((x) => x.key === key)
      if (m) m.count++
    }

    return months
  }, [contacts])

  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1)

  /* ---- export ---- */

  const handleExport = () => {
    const lines: string[] = []

    lines.push('NexCRM Report')
    lines.push('')
    lines.push('Status Breakdown')
    lines.push('Status,Count,Percentage')
    for (const s of ['Lead', 'Active', 'Inactive', 'Churned'] as Status[]) {
      lines.push(`${s},${statusCounts[s]},${total ? ((statusCounts[s] / total) * 100).toFixed(1) : 0}%`)
    }

    lines.push('')
    lines.push('Top 5 Contacts by Deal Value')
    lines.push('Rank,Name,Company,Deal Value')
    top5.forEach((c, i) => {
      const name = c.name.includes(',') ? `"${c.name}"` : c.name
      const co = (c.company || '').includes(',') ? `"${c.company}"` : c.company || ''
      lines.push(`${i + 1},${name},${co},${c.deal_value}`)
    })

    lines.push('')
    lines.push('Summary Stats')
    lines.push(`Average Deal Value,${summaryStats.avg.toFixed(0)}`)
    lines.push(`Highest Deal,${summaryStats.highest}`)
    lines.push(`Active Pipeline,${summaryStats.activePipeline}`)
    lines.push(`Conversion Rate,${summaryStats.conversion.toFixed(1)}%`)

    lines.push('')
    lines.push('Monthly Contacts Added')
    lines.push('Month,Count')
    for (const m of monthlyData) {
      lines.push(`${m.label},${m.count}`)
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexcrm-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---- render ---- */

  return (
    <AppShell title="Reports">
      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3 fade-in">
          <div className="shrink-0 text-destructive">⚠</div>
          <div>
            <p className="text-sm font-medium text-destructive">Supabase error: {error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check your .env.local file has correct credentials.
            </p>
          </div>
        </div>
      )}

      {/* Export button */}
      {!loading && contacts.length > 0 && (
        <div className="flex justify-end mb-5 fade-in">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      )}

      {loading ? (
        /* ---------- SKELETON ---------- */
        <div className="space-y-5">
          <SkeletonSection lines={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonSection lines={5} />
            <SkeletonSection lines={4} />
          </div>
          <SkeletonSection lines={3} />
        </div>
      ) : (
        <div className="space-y-5 fade-in">
          {/* ===== SECTION 1 — Status Breakdown ===== */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Status Breakdown</h2>
            </div>

            {total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No contacts to analyze. Add some contacts first.
              </p>
            ) : (
              <div className="space-y-3">
                {(['Lead', 'Active', 'Inactive', 'Churned'] as Status[]).map((s) => {
                  const count = statusCounts[s]
                  const pct = total > 0 ? (count / total) * 100 : 0
                  const meta = statusMeta[s]
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className="w-20 shrink-0 flex items-center justify-between">
                        <span className={`text-sm font-medium ${meta.color}`}>{s}</span>
                        <span className="text-xs text-muted-foreground ml-1">{count}</span>
                      </div>
                      <div className="flex-1 h-7 rounded-lg bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-lg ${meta.bar} transition-all duration-700 ease-out`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-12 text-right tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ===== SECTION 2 — Top 5 + Summary ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top 5 */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Top 5 by Deal Value</h2>
              </div>

              {top5.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No contacts yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {top5.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.company || 'No company'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                        {formatCurrency(Number(c.deal_value) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary stats */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Summary Stats</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: 'Average Deal',
                    value: formatCurrency(summaryStats.avg),
                    icon: IndianRupee,
                    iconBg: 'bg-blue-500/10',
                    iconColor: 'text-blue-500',
                  },
                  {
                    label: 'Highest Deal',
                    value: formatCurrency(summaryStats.highest),
                    icon: Zap,
                    iconBg: 'bg-amber-500/10',
                    iconColor: 'text-amber-500',
                  },
                  {
                    label: 'Active Pipeline',
                    value: formatCurrency(summaryStats.activePipeline),
                    icon: Target,
                    iconBg: 'bg-emerald-500/10',
                    iconColor: 'text-emerald-500',
                  },
                  {
                    label: 'Conversion Rate',
                    value: `${summaryStats.conversion.toFixed(1)}%`,
                    icon: Percent,
                    iconBg: 'bg-purple-500/10',
                    iconColor: 'text-purple-500',
                  },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/40"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ===== SECTION 3 — Monthly Breakdown ===== */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Contacts Added — Last 6 Months
              </h2>
            </div>

            <div className="space-y-2.5">
              {monthlyData.map((m) => {
                const pct = maxMonthly > 0 ? (m.count / maxMonthly) * 100 : 0
                return (
                  <div key={m.key} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground text-right">
                      {m.label}
                    </span>
                    <div className="flex-1 h-7 rounded-lg bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">
                      {m.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

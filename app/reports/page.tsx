'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, BarChart3, CalendarDays, TrendingUp } from 'lucide-react'
import AppShell from '@/components/app-shell'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import { formatDatabaseError } from '@/lib/db-error'

type Status = Contact['status']

const STATUS_ORDER: Status[] = ['Lead', 'Active', 'Inactive', 'Churned']

const STATUS_META: Record<
  Status,
  {
    barClassName: string
    textClassName: string
    badgeClassName: string
  }
> = {
  Lead: {
    barClassName: 'bg-blue-500',
    textClassName: 'text-blue-600 dark:text-blue-400',
    badgeClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  Active: {
    barClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-600 dark:text-emerald-400',
    badgeClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  Inactive: {
    barClassName: 'bg-slate-400',
    textClassName: 'text-slate-600 dark:text-slate-400',
    badgeClassName: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  Churned: {
    barClassName: 'bg-red-500',
    textClassName: 'text-red-600 dark:text-red-400',
    badgeClassName: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

function formatCurrency(value: number): string {
  return `\u20B9${Math.round(value).toLocaleString('en-IN')}`
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? '')
  return stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue
}

function ReportCard({
  title,
  icon: Icon,
  iconClassName,
  children,
  className = '',
}: {
  title: string
  icon: typeof BarChart3
  iconClassName: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
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

function SkeletonSection({
  titleWidth,
  rows,
  className = '',
}: {
  titleWidth: string
  rows: number
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="skeleton h-5 rounded" style={{ width: titleWidth }} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="skeleton h-4 rounded"
              style={{ width: `${56 + ((index * 13) % 20)}px` }}
            />
            <div className="h-7 flex-1 rounded-lg bg-muted">
              <div
                className="skeleton h-full rounded-lg"
                style={{ width: `${35 + ((index * 17) % 45)}%` }}
              />
            </div>
            <div className="skeleton h-4 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

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
      setError(formatDatabaseError(error, 'load reports'))
      setContacts([])
    } else if (data) {
      setContacts(data as Contact[])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchContacts()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [fetchContacts])

  const totalContacts = contacts.length

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      Lead: 0,
      Active: 0,
      Inactive: 0,
      Churned: 0,
    }

    for (const contact of contacts) {
      counts[contact.status] += 1
    }

    return counts
  }, [contacts])

  const topContacts = useMemo(
    () =>
      [...contacts]
        .sort((a, b) => (Number(b.deal_value) || 0) - (Number(a.deal_value) || 0))
        .slice(0, 5),
    [contacts]
  )

  const summaryStats = useMemo(() => {
    const dealValues = contacts.map((contact) => Number(contact.deal_value) || 0)
    const totalDealValue = dealValues.reduce((sum, value) => sum + value, 0)
    const highestDeal = dealValues.length > 0 ? Math.max(...dealValues) : 0
    const activePipeline = contacts
      .filter((contact) => contact.status === 'Active')
      .reduce((sum, contact) => sum + (Number(contact.deal_value) || 0), 0)
    const averageDealValue = totalContacts > 0 ? totalDealValue / totalContacts : 0
    const conversionRate =
      totalContacts > 0 ? (statusCounts.Active / totalContacts) * 100 : 0

    return {
      averageDealValue,
      highestDeal,
      activePipeline,
      conversionRate,
    }
  }, [contacts, statusCounts.Active, totalContacts])

  const monthlyBreakdown = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return {
        key: getMonthKey(monthDate),
        label: getMonthLabel(monthDate),
        count: 0,
      }
    })

    for (const contact of contacts) {
      if (!contact.created_at) continue
      const createdAt = new Date(contact.created_at)
      const key = getMonthKey(createdAt)
      const month = months.find((entry) => entry.key === key)
      if (month) {
        month.count += 1
      }
    }

    return months
  }, [contacts])

  const maxMonthlyCount = Math.max(1, ...monthlyBreakdown.map((month) => month.count))

  const handleExport = () => {
    const rows: string[] = []

    rows.push('Section,Metric,Value')
    STATUS_ORDER.forEach((status) => {
      const percentage =
        totalContacts > 0 ? ((statusCounts[status] / totalContacts) * 100).toFixed(1) : '0.0'
      rows.push(
        [
          'Status Breakdown',
          `${status} Count`,
          `${statusCounts[status]} (${percentage}%)`,
        ].map(escapeCsv).join(',')
      )
    })

    rows.push(['Summary Stats', 'Average Deal Value', formatCurrency(summaryStats.averageDealValue)].map(escapeCsv).join(','))
    rows.push(['Summary Stats', 'Highest Deal', formatCurrency(summaryStats.highestDeal)].map(escapeCsv).join(','))
    rows.push(['Summary Stats', 'Total Active Pipeline', formatCurrency(summaryStats.activePipeline)].map(escapeCsv).join(','))
    rows.push(['Summary Stats', 'Conversion Rate', `${summaryStats.conversionRate.toFixed(1)}%`].map(escapeCsv).join(','))

    topContacts.forEach((contact, index) => {
      rows.push(
        [
          'Top Contacts',
          `#${index + 1}`,
          `${contact.name} - ${contact.company || 'No company'} - ${formatCurrency(
            Number(contact.deal_value) || 0
          )}`,
        ]
          .map(escapeCsv)
          .join(',')
      )
    })

    monthlyBreakdown.forEach((month) => {
      rows.push(
        ['Monthly Breakdown', month.label, month.count].map(escapeCsv).join(',')
      )
    })

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nexcrm-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Reports">
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Pipeline analytics</p>
            <p className="text-xs text-muted-foreground">
              Insights across status, top deals, and recent activity.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || contacts.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-5 w-full">
            <SkeletonSection titleWidth="160px" rows={4} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 w-full">
              <SkeletonSection titleWidth="170px" rows={5} />
              <SkeletonSection titleWidth="140px" rows={4} />
            </div>
            <SkeletonSection titleWidth="150px" rows={6} />
          </div>
        ) : (
          <div className="space-y-5 w-full">
            <ReportCard
              title="Status Breakdown"
              icon={BarChart3}
              iconClassName="bg-indigo-500/10 text-indigo-500"
            >
              {totalContacts === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No contacts to analyze yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {STATUS_ORDER.map((status) => {
                    const count = statusCounts[status]
                    const percentage =
                      totalContacts > 0 ? (count / totalContacts) * 100 : 0
                    const meta = STATUS_META[status]

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className="flex w-20 shrink-0 items-center justify-between gap-2 sm:w-24">
                          <span className={`text-sm font-medium ${meta.textClassName}`}>
                            {status}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {count}
                          </span>
                        </div>
                        <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                          <div
                            className={`h-full rounded-lg ${meta.barClassName} transition-all duration-700`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </ReportCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 w-full">
              <ReportCard
                title="Top 5 by Deal Value"
                icon={TrendingUp}
                iconClassName="bg-amber-500/10 text-amber-500"
              >
                {topContacts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No contacts yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {topContacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {contact.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.company || 'No company'}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(Number(contact.deal_value) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ReportCard>

              <ReportCard
                title="Summary Stats"
                icon={TrendingUp}
                iconClassName="bg-emerald-500/10 text-emerald-500"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: 'Average Deal Value',
                      value: formatCurrency(summaryStats.averageDealValue),
                      badgeClassName:
                        'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    },
                    {
                      label: 'Highest Deal',
                      value: formatCurrency(summaryStats.highestDeal),
                      badgeClassName:
                        'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    },
                    {
                      label: 'Total Active Pipeline',
                      value: formatCurrency(summaryStats.activePipeline),
                      badgeClassName:
                        'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    },
                    {
                      label: 'Conversion Rate',
                      value: `${summaryStats.conversionRate.toFixed(1)}%`,
                      badgeClassName:
                        'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <span
                          className={`inline-flex shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${stat.badgeClassName}`}
                        >
                          Live
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </ReportCard>
            </div>

            <ReportCard
              title="Monthly Breakdown"
              icon={CalendarDays}
              iconClassName="bg-indigo-500/10 text-indigo-500"
            >
              <div className="space-y-2.5">
                {monthlyBreakdown.map((month) => {
                  const percentage = (month.count / maxMonthlyCount) * 100
                  return (
                    <div key={month.key} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-right text-xs font-medium text-muted-foreground">
                        {month.label}
                      </span>
                      <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                          style={{
                            width: `${Math.max(percentage, month.count > 0 ? 6 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                        {month.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ReportCard>
          </div>
        )}
      </div>
    </AppShell>
  )
}

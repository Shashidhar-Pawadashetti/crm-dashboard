'use client'

import AppShell from '@/components/app-shell'
import DashboardCards from '@/components/dashboard-cards'
import { BarChart3, TrendingUp, ArrowUpRight } from 'lucide-react'

const MONTHS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
const BAR_HEIGHTS = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50]

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="w-full max-w-full space-y-6">
        <DashboardCards />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full">
          {/* Sales Overview */}
          <div className="fade-in lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Sales Overview</h2>
              </div>
              <span className="text-xs text-muted-foreground">This month</span>
            </div>

            <div className="space-y-3">
              {/* Chart bars */}
              <div className="flex h-44 items-end gap-1.5 px-1">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={MONTHS[i]}
                    className="flex-1 cursor-pointer rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-500 opacity-60 transition-opacity hover:opacity-100"
                    style={{ height: `${h}%` }}
                    title={MONTHS[i]}
                  />
                ))}
              </div>

              {/* Month labels */}
              <div className="flex gap-1.5 px-1">
                {MONTHS.map((m) => (
                  <div
                    key={m}
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">+12.5%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="fade-in rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 text-base font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-2.5">
              {[
                { title: 'View Pipeline', description: 'Track your deals', href: '/pipeline' },
                { title: 'Generate Report', description: 'Export analytics', href: '/reports' },
                { title: 'Manage Contacts', description: 'Add or edit contacts', href: '/' },
              ].map((action) => (
                <a
                  key={action.title}
                  href={action.href}
                  className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/50 p-3.5 transition-all hover:border-border hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </a>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status Legend
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Lead', color: 'bg-blue-500' },
                  { label: 'Active', color: 'bg-emerald-500' },
                  { label: 'Inactive', color: 'bg-slate-400' },
                  { label: 'Churned', color: 'bg-red-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

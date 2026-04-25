'use client'

import AppShell from '@/components/app-shell'
import DashboardCards from '@/components/dashboard-cards'
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <DashboardCards />

      {/* Dashboard content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Sales Overview
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>

          {/* Mini chart placeholder using bars */}
          <div className="flex items-end gap-2 h-40 px-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-500 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${h}%` }}
                  title={`Week ${i + 1}`}
                />
              )
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                +12.5%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        </div>

        {/* Quick Actions / Status Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 fade-in">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              {
                title: 'View Pipeline',
                description: 'Track your deals',
                href: '/pipeline',
              },
              {
                title: 'Generate Report',
                description: 'Export analytics',
                href: '/reports',
              },
              {
                title: 'Manage Contacts',
                description: 'Add or edit contacts',
                href: '/',
              },
            ].map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ))}
          </div>

          {/* Status legend */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Status Legend
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Lead', color: 'bg-blue-500' },
                { label: 'Active', color: 'bg-emerald-500' },
                { label: 'Inactive', color: 'bg-slate-400' },
                { label: 'Churned', color: 'bg-red-500' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

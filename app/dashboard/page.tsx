'use client'

import AppShell from '@/components/app-shell'
import DashboardCards from '@/components/dashboard-cards'
import { BarChart3, TrendingUp, ArrowUpRight } from 'lucide-react'

const MONTHS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
const BAR_HEIGHTS = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50]

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Sales Overview</h2>
            </div>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>

          {/* Chart bars */}
          <div className="flex items-end gap-1.5 h-44 px-1">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ height: `${h}%` }}
                title={`${MONTHS[i]}`}
              />
            ))}
          </div>

          {/* Month labels */}
          <div className="flex gap-1.5 px-1 mt-2">
            {MONTHS.map((m) => (
              <div key={m} className="flex-1 text-center text-[10px] text-muted-foreground">{m}</div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">+12.5%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-6 fade-in">
          <h2 className="text-base font-semibold text-foreground mb-5">Quick Actions</h2>
          <div className="space-y-2.5">
            {[
              { title: 'View Pipeline', description: 'Track your deals', href: '/pipeline' },
              { title: 'Generate Report', description: 'Export analytics', href: '/reports' },
              { title: 'Manage Contacts', description: 'Add or edit contacts', href: '/' },
            ].map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
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
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

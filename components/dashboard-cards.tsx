'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  TrendingUp,
  IndianRupee,
  CalendarPlus,
} from 'lucide-react'

interface KpiData {
  totalContacts: number
  activeDeals: number
  totalPipeline: number
  newThisMonth: number
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L'
  if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K'
  return '₹' + value.toLocaleString('en-IN')
}

const cards = [
  {
    key: 'totalContacts' as const,
    label: 'Total Contacts',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'activeDeals' as const,
    label: 'Active Deals',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'totalPipeline' as const,
    label: 'Pipeline Value',
    icon: IndianRupee,
    gradient: 'from-indigo-500 to-purple-500',
    bgLight: 'bg-indigo-500/10',
    textColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'newThisMonth' as const,
    label: 'New This Month',
    icon: CalendarPlus,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
]

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="mb-1 h-8 w-20 rounded skeleton" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  )
}

export default function DashboardCards() {
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKPIs() {
      setLoading(true)

      // Fetch all contacts to compute KPIs
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('status, deal_value, created_at')

      if (error || !contacts) {
        setLoading(false)
        return
      }

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      setData({
        totalContacts: contacts.length,
        activeDeals: contacts.filter((c) => c.status === 'Active').length,
        totalPipeline: contacts.reduce(
          (sum, c) => sum + (Number(c.deal_value) || 0),
          0
        ),
        newThisMonth: contacts.filter(
          (c) => c.created_at >= startOfMonth
        ).length,
      })

      setLoading(false)
    }
    fetchKPIs()
  }, [])

  if (loading) {
    return (
      <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon
        const value = data ? data[card.key] : 0
        const displayValue =
          card.key === 'totalPipeline' ? formatCurrency(value) : String(value)

        return (
          <div
            key={card.key}
            className="group fade-in rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgLight} transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {displayValue}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`h-1 w-10 rounded-full bg-gradient-to-r ${card.gradient}`}
              />
              <span className="text-xs text-muted-foreground">Live data</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppShell from '@/components/app-shell'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import { IndianRupee } from 'lucide-react'

type Status = Contact['status']

const columns: {
  status: Status
  label: string
  color: string
  bgLight: string
  badgeBg: string
  badgeText: string
  borderAccent: string
}[] = [
  {
    status: 'Lead',
    label: 'Lead',
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/10 border-blue-500/20',
    badgeText: 'text-blue-600 dark:text-blue-400',
    borderAccent: 'border-t-blue-500',
  },
  {
    status: 'Active',
    label: 'Active',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    borderAccent: 'border-t-emerald-500',
  },
  {
    status: 'Inactive',
    label: 'Inactive',
    color: 'text-slate-500 dark:text-slate-400',
    bgLight: 'bg-slate-500/10',
    badgeBg: 'bg-slate-500/10 border-slate-500/20',
    badgeText: 'text-slate-600 dark:text-slate-400',
    borderAccent: 'border-t-slate-400',
  },
  {
    status: 'Churned',
    label: 'Churned',
    color: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-500/10',
    badgeBg: 'bg-red-500/10 border-red-500/20',
    badgeText: 'text-red-600 dark:text-red-400',
    borderAccent: 'border-t-red-500',
  },
]

function formatCurrency(value: number): string {
  if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L'
  if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K'
  return '₹' + value.toLocaleString('en-IN')
}

function SkeletonCard({ i }: { i: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="skeleton h-4 rounded mb-2" style={{ width: `${65 + (i * 13) % 30}%` }} />
      <div className="skeleton h-3 rounded mb-3" style={{ width: `${45 + (i * 17) % 35}%` }} />
      <div className="flex justify-end">
        <div className="skeleton h-5 w-16 rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonColumn({ col }: { col: number }) {
  return (
    <div className="min-w-[260px] flex-1 flex flex-col">
      <div className="bg-card border border-border rounded-2xl border-t-[3px] border-t-muted p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-5 w-7 rounded-lg" />
        </div>
        <div className="skeleton h-3 w-24 rounded mb-4" />
        <div className="space-y-2.5">
          {[...Array(2 + col)].map((_, i) => (
            <SkeletonCard key={i} i={i + col * 3} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PipelinePage() {
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

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel('pipeline-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) => {
            if (prev.some((c) => c.id === (payload.new as Contact).id)) return prev
            return [payload.new as Contact, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === (payload.new as Contact).id ? (payload.new as Contact) : c
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) =>
            prev.filter((c) => c.id !== (payload.old as Contact).id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const grouped = useMemo(() => {
    const map: Record<Status, Contact[]> = {
      Lead: [],
      Active: [],
      Inactive: [],
      Churned: [],
    }
    for (const c of contacts) {
      if (map[c.status]) map[c.status].push(c)
    }
    return map
  }, [contacts])

  return (
    <AppShell title="Pipeline">
      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3 fade-in">
          <div className="shrink-0 w-5 h-5 mt-0.5 text-destructive">⚠</div>
          <div>
            <p className="text-sm font-medium text-destructive">Supabase error: {error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check your .env.local file has the correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </p>
          </div>
        </div>
      )}

      {/* Pipeline columns */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {[0, 1, 2, 3].map((col) => (
            <SkeletonColumn key={col} col={col} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {columns.map((col) => {
            const items = grouped[col.status]
            const totalValue = items.reduce(
              (sum, c) => sum + (Number(c.deal_value) || 0),
              0
            )

            return (
              <div key={col.status} className="min-w-[260px] flex-1 flex flex-col">
                <div
                  className={`bg-card border border-border rounded-2xl border-t-[3px] ${col.borderAccent} p-4 flex flex-col h-full`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`text-sm font-semibold ${col.color}`}>
                      {col.label}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${col.badgeBg} ${col.badgeText}`}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* Column total */}
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {formatCurrency(totalValue)} total
                  </p>

                  {/* Cards */}
                  <div className="space-y-2.5 flex-1">
                    {items.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          No {col.label.toLowerCase()} contacts
                        </p>
                      </div>
                    ) : (
                      items.map((contact) => (
                        <div
                          key={contact.id}
                          className="bg-card border border-border rounded-xl p-3 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-200 cursor-default group"
                        >
                          <p className="text-sm font-semibold text-foreground truncate">
                            {contact.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {contact.company || 'No company'}
                          </p>
                          <div className="flex justify-end mt-2.5">
                            <span
                              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${col.badgeBg} ${col.badgeText}`}
                            >
                              {formatCurrency(Number(contact.deal_value) || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}

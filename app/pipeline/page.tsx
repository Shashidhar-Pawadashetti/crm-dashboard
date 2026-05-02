'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/app-shell'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import {
  formatDatabaseError,
  formatSupabaseConfigurationError,
} from '@/lib/db-error'

type Status = Contact['status']

type PipelineColumn = {
  status: Status
  headerClassName: string
  badgeClassName: string
  dealBadgeClassName: string
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    status: 'Lead',
    headerClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badgeClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dealBadgeClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    status: 'Active',
    headerClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dealBadgeClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    status: 'Inactive',
    headerClassName: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
    badgeClassName: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dealBadgeClassName: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  {
    status: 'Churned',
    headerClassName: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
    badgeClassName: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
    dealBadgeClassName: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  },
]

function formatCurrency(value: number): string {
  return `\u20B9${value.toLocaleString('en-IN')}`
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div
        className="skeleton mb-2 h-4 rounded"
        style={{ width: `${58 + ((index * 11) % 25)}%` }}
      />
      <div
        className="skeleton mb-4 h-3 rounded"
        style={{ width: `${42 + ((index * 17) % 30)}%` }}
      />
      <div className="flex justify-end">
        <div className="skeleton h-6 w-20 rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonColumn({ status, index }: { status: Status; index: number }) {
  return (
    <section className="w-[280px] min-w-[280px] shrink-0 rounded-2xl border border-border bg-muted/20 p-4 sm:w-[300px] md:w-full md:min-w-0 md:shrink">
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-6 w-8 rounded-full" />
        </div>
        <div className="skeleton h-3 w-28 rounded" />
      </div>

      <div className="space-y-3">
        {[0, 1 + (index % 2)].map((offset) => (
          <SkeletonCard key={`${status}-${offset}`} index={index * 3 + offset} />
        ))}
      </div>
    </section>
  )
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!supabase) {
      setError(formatSupabaseConfigurationError('load pipeline data'))
      setContacts([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(formatDatabaseError(error, 'load pipeline data'))
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

  useEffect(() => {
    if (!supabase) return
    const supabaseClient = supabase
    const channel = supabaseClient
      .channel('pipeline-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) => {
            if (prev.some((contact) => contact.id === (payload.new as Contact).id)) {
              return prev
            }

            return [payload.new as Contact, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) =>
            prev.map((contact) =>
              contact.id === (payload.new as Contact).id
                ? (payload.new as Contact)
                : contact
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) =>
            prev.filter((contact) => contact.id !== (payload.old as Contact).id)
          )
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])

  const groupedContacts = useMemo(() => {
    const grouped: Record<Status, Contact[]> = {
      Lead: [],
      Active: [],
      Inactive: [],
      Churned: [],
    }

    for (const contact of contacts) {
      grouped[contact.status].push(contact)
    }

    return grouped
  }, [contacts])

  return (
    <AppShell title="Pipeline">
      <div className="w-full space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="-mx-1 overflow-x-auto px-1 pb-2 md:mx-0 md:overflow-visible md:px-0">
          <div className="grid w-full min-w-max grid-flow-col gap-4 md:min-w-0 md:grid-flow-row md:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-6">
            {loading
              ? PIPELINE_COLUMNS.map((column, index) => (
                  <SkeletonColumn
                    key={column.status}
                    status={column.status}
                    index={index}
                  />
                ))
              : PIPELINE_COLUMNS.map((column) => {
                  const items = groupedContacts[column.status]
                  const totalValue = items.reduce(
                    (sum, contact) => sum + (Number(contact.deal_value) || 0),
                    0
                  )

                  return (
                    <section
                      key={column.status}
                      className="flex w-[280px] min-w-[280px] shrink-0 flex-col rounded-2xl border border-border bg-muted/20 p-4 sm:w-[300px] md:w-full md:min-w-0 md:shrink"
                    >
                      <div
                        className={`mb-4 rounded-xl border px-4 py-3 ${column.headerClassName}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold">{column.status}</h2>
                          <span
                            className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${column.badgeClassName}`}
                          >
                            {items.length}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatCurrency(totalValue)} total
                        </p>
                      </div>

                      <div className="space-y-3">
                        {items.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-center text-sm text-muted-foreground">
                            No {column.status.toLowerCase()} contacts
                          </div>
                        ) : (
                          items.map((contact) => (
                            <article
                              key={contact.id}
                              className="rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <p className="truncate text-sm font-semibold text-foreground">
                                {contact.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {contact.company || 'No company'}
                              </p>
                              <div className="mt-3 flex items-center justify-end">
                                <span
                                  className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums ${column.dealBadgeClassName}`}
                                >
                                  {formatCurrency(Number(contact.deal_value) || 0)}
                                </span>
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </section>
                  )
                })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

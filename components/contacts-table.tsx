'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import { formatDatabaseError } from '@/lib/db-error'
import ContactModal from './contact-modal'
import ConfirmDialog from './confirm-dialog'
import {
  Search,
  Filter,
  ChevronDown,
  Pencil,
  Trash2,
  Users,
  UserSearch,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

type SortKey = 'name' | 'company' | 'deal_value' | 'last_contacted' | null
type SortDir = 'asc' | 'desc'

const sortableColumns: Record<string, SortKey> = {
  Name: 'name',
  Company: 'company',
  'Deal Value': 'deal_value',
  'Last Contacted': 'last_contacted',
}

const statusColors: Record<Contact['status'], string> = {
  Lead: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Inactive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  Churned: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
}

function formatCurrency(value: number): string {
  return '₹' + value.toLocaleString('en-IN')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const skeletonWidths = [70, 85, 60, 75, 50, 65, 80, 55]

function SkeletonRow({ row }: { row: number }) {
  return (
    <tr className="border-b border-border">
      {skeletonWidths.map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="skeleton h-4 rounded"
            style={{ width: `${w + (row * 7 + i * 3) % 20}%` }}
          />
        </td>
      ))}
    </tr>
  )
}

export default function ContactsTable({
  modalOpen,
  setModalOpen,
}: {
  modalOpen: boolean
  setModalOpen: (v: boolean) => void
}) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(formatDatabaseError(error, 'load contacts'))
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
    const channel = supabase
      .channel('contacts-realtime')
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
              c.id === (payload.new as Contact).id
                ? (payload.new as Contact)
                : c
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

  const filteredContacts = useMemo(() => {
    let result = contacts

    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      )
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? ''
        const bVal = b[sortKey] ?? ''

        if (sortKey === 'deal_value') {
          return sortDir === 'asc'
            ? Number(aVal) - Number(bVal)
            : Number(bVal) - Number(aVal)
        }

        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        const cmp = aStr.localeCompare(bStr)

        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [contacts, search, statusFilter, sortKey, sortDir])

  const handleAddContact = async (
    contact: Omit<Contact, 'id' | 'created_at'>
  ) => {
    setMutationError(null)
    const { error } = await supabase.from('contacts').insert([contact])
    if (error) throw new Error(formatDatabaseError(error, 'add contact'))
    await fetchContacts()
  }

  const handleEditContact = async (
    contact: Omit<Contact, 'id' | 'created_at'>
  ) => {
    if (!editingContact) return

    setMutationError(null)
    const { error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', editingContact.id)

    if (error) throw new Error(formatDatabaseError(error, 'update contact'))

    setEditingContact(null)
    await fetchContacts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setMutationError(null)

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      setMutationError(formatDatabaseError(error, 'delete contact'))
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }

    setDeleteTarget(null)
  }

  return (
    <>
      <div className="fade-in mb-5 flex w-full flex-wrap items-center gap-3">
        <div className="relative w-full flex-1 sm:min-w-[240px] sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="contact-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="All">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Churned">Churned</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          id="export-csv-btn"
          onClick={() => {
            if (filteredContacts.length === 0) return

            const headers = [
              'Name',
              'Email',
              'Phone',
              'Company',
              'Status',
              'Deal Value',
              'Last Contacted',
            ]

            const escape = (v: string) => {
              const s = String(v ?? '')
              return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s
            }

            const rows = filteredContacts.map((c) =>
              [
                c.name,
                c.email,
                c.phone,
                c.company,
                c.status,
                c.deal_value,
                c.last_contacted,
              ]
                .map((v) => escape(String(v ?? '')))
                .join(',')
            )

            const csv = [headers.join(','), ...rows].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `nexcrm-contacts-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
          disabled={filteredContacts.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        <div className="order-last ml-auto w-full text-sm text-muted-foreground sm:order-none sm:w-auto sm:text-right">
          Showing{' '}
          <span className="font-semibold text-foreground">
            {filteredContacts.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground">{contacts.length}</span>{' '}
          contacts
        </div>
      </div>

      {(error || mutationError) && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          {error ?? mutationError}
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  'Name',
                  'Email',
                  'Phone',
                  'Company',
                  'Status',
                  'Deal Value',
                  'Last Contacted',
                  'Actions',
                ].map((h) => {
                  const colKey = sortableColumns[h] ?? null
                  return (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${colKey ? 'cursor-pointer select-none transition-colors hover:text-foreground' : ''}`}
                      onClick={colKey ? () => toggleSort(colKey) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {colKey && sortKey === colKey && (
                          sortDir === 'asc'
                            ? <ArrowUp className="h-3 w-3" />
                            : <ArrowDown className="h-3 w-3" />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <SkeletonRow key={i} row={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : error && contacts.length === 0 ? null : filteredContacts.length === 0 ? (
        <div className="fade-in rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
            {search || statusFilter !== 'All' ? (
              <UserSearch className="h-8 w-8 text-indigo-500" />
            ) : (
              <Users className="h-8 w-8 text-indigo-500" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {search || statusFilter !== 'All'
              ? 'No contacts found'
              : 'No contacts yet'}
          </h3>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first contact using the button above.'}
          </p>
        </div>
      ) : (
        <div className="fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    'Name',
                    'Email',
                    'Phone',
                    'Company',
                    'Status',
                    'Deal Value',
                    'Last Contacted',
                    'Actions',
                  ].map((h) => {
                    const colKey = sortableColumns[h] ?? null
                    return (
                      <th
                        key={h}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${colKey ? 'cursor-pointer select-none transition-colors hover:text-foreground' : ''}`}
                        onClick={colKey ? () => toggleSort(colKey) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {h}
                          {colKey && sortKey === colKey && (
                            sortDir === 'asc'
                              ? <ArrowUp className="h-3 w-3" />
                              : <ArrowDown className="h-3 w-3" />
                          )}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="group border-b border-border transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-foreground">
                        {contact.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {contact.email}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {contact.phone || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {contact.company || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${statusColors[contact.status]}`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-sm font-medium text-foreground">
                      {formatCurrency(contact.deal_value)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {formatDate(contact.last_contacted)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          onClick={() => {
                            setEditingContact(contact)
                            setModalOpen(true)
                          }}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-500"
                          title="Edit contact"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(contact)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-destructive"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingContact(null)
        }}
        onSubmit={editingContact ? handleEditContact : handleAddContact}
        editingContact={editingContact}
        onError={(message) => setMutationError(message)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </>
  )
}

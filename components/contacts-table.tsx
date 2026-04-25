'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import ContactModal from './contact-modal'
import ConfirmDialog from './confirm-dialog'
import {
  Search,
  Filter,
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

// Loading skeleton row
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
      setError(error.message)
    } else if (data) {
      setContacts(data as Contact[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Real-time subscription: sync changes from other tabs/clients
  useEffect(() => {
    const channel = supabase
      .channel('contacts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts' },
        (payload) => {
          setContacts((prev) => {
            // Avoid duplicates if we just inserted it ourselves
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
        let aVal = a[sortKey] ?? ''
        let bVal = b[sortKey] ?? ''
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
    const { error } = await supabase.from('contacts').insert([contact])
    if (error) throw error
    await fetchContacts()
  }

  const handleEditContact = async (
    contact: Omit<Contact, 'id' | 'created_at'>
  ) => {
    if (!editingContact) return
    const { error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', editingContact.id)
    if (error) throw error
    setEditingContact(null)
    await fetchContacts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', deleteTarget.id)
    if (!error) {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 fade-in">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="contact-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Churned">Churned</option>
          </select>
        </div>

        {/* Export CSV */}
        <button
          id="export-csv-btn"
          onClick={() => {
            if (filteredContacts.length === 0) return
            const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Last Contacted']
            const escape = (v: string) => {
              const s = String(v ?? '')
              return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s
            }
            const rows = filteredContacts.map((c) =>
              [c.name, c.email, c.phone, c.company, c.status, c.deal_value, c.last_contacted]
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
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        {/* Count */}
        <div className="text-sm text-muted-foreground ml-auto">
          Showing{' '}
          <span className="font-semibold text-foreground">
            {filteredContacts.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-foreground">
            {contacts.length}
          </span>{' '}
          contacts
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Last Contacted', 'Actions'].map(
                  (h) => {
                    const colKey = sortableColumns[h] ?? null
                    return (
                      <th
                        key={h}
                        className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${colKey ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}`}
                        onClick={colKey ? () => toggleSort(colKey) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {h}
                          {colKey && sortKey === colKey && (
                            sortDir === 'asc'
                              ? <ArrowUp className="w-3 h-3" />
                              : <ArrowDown className="w-3 h-3" />
                          )}
                        </span>
                      </th>
                    )
                  }
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <SkeletonRow key={i} row={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredContacts.length === 0 ? (
        /* Empty State */
        <div className="bg-card border border-border rounded-2xl p-12 text-center fade-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            {search || statusFilter !== 'All' ? (
              <UserSearch className="w-8 h-8 text-indigo-500" />
            ) : (
              <Users className="w-8 h-8 text-indigo-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search || statusFilter !== 'All'
              ? 'No contacts found'
              : 'No contacts yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first contact using the button above.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm fade-in">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Last Contacted', 'Actions'].map(
                    (h) => {
                      const colKey = sortableColumns[h] ?? null
                      return (
                        <th
                          key={h}
                          className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${colKey ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}`}
                          onClick={colKey ? () => toggleSort(colKey) : undefined}
                        >
                          <span className="inline-flex items-center gap-1">
                            {h}
                            {colKey && sortKey === colKey && (
                              sortDir === 'asc'
                                ? <ArrowUp className="w-3 h-3" />
                                : <ArrowDown className="w-3 h-3" />
                            )}
                          </span>
                        </th>
                      )
                    }
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-foreground text-sm">
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[contact.status]}`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground tabular-nums">
                      {formatCurrency(contact.deal_value)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {formatDate(contact.last_contacted)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingContact(contact)
                            setModalOpen(true)
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                          title="Edit contact"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(contact)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-500/10 transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Modal */}
      <ContactModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingContact(null)
        }}
        onSubmit={editingContact ? handleEditContact : handleAddContact}
        editingContact={editingContact}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </>
  )
}

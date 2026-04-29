'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Contact } from '@/lib/types'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (contact: Omit<Contact, 'id' | 'created_at'>) => Promise<void>
  editingContact?: Contact | null
  onError?: (message: string) => void
}

export default function ContactModal({
  isOpen,
  onClose,
  onSubmit,
  editingContact,
  onError,
}: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'Lead' as Contact['status'],
    deal_value: '',
    last_contacted: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (editingContact) {
        setFormData({
          name: editingContact.name,
          email: editingContact.email,
          phone: editingContact.phone,
          company: editingContact.company,
          status: editingContact.status,
          deal_value: String(editingContact.deal_value),
          last_contacted: editingContact.last_contacted
            ? editingContact.last_contacted.split('T')[0]
            : '',
        })
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'Lead',
          deal_value: '',
          last_contacted: new Date().toISOString().split('T')[0],
        })
      }
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [editingContact, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: formData.status,
        deal_value: Number(formData.deal_value) || 0,
        last_contacted: formData.last_contacted,
      })
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save contact. Please try again.'
      setSubmitError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses =
    'w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-200'

  const labelClasses = 'block text-sm font-medium text-foreground mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div
        className="overlay-fade absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="slide-up relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            onClick={onClose}
            className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {submitError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className={labelClasses}>
                Name *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className={labelClasses}>
                Email *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@company.com"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className={labelClasses}>
                Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="contact-company" className={labelClasses}>
                Company
              </label>
              <input
                id="contact-company"
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Acme Inc."
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-status" className={labelClasses}>
                Status
              </label>
              <select
                id="contact-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Contact['status'],
                  })
                }
                className={inputClasses}
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Churned">Churned</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-deal-value" className={labelClasses}>
                Deal Value (₹)
              </label>
              <input
                id="contact-deal-value"
                type="number"
                min="0"
                value={formData.deal_value}
                onChange={(e) =>
                  setFormData({ ...formData, deal_value: e.target.value })
                }
                placeholder="50000"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-last-contacted" className={labelClasses}>
              Last Contacted
            </label>
            <input
              id="contact-last-contacted"
              type="date"
              value={formData.last_contacted}
              onChange={(e) =>
                setFormData({ ...formData, last_contacted: e.target.value })
              }
              className={inputClasses}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse items-stretch gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : editingContact
                  ? 'Update Contact'
                  : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

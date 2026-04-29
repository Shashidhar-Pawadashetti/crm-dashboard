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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm overlay-fade"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

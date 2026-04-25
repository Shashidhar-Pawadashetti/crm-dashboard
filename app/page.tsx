'use client'

import { useState } from 'react'
import AppShell from '@/components/app-shell'
import ContactsTable from '@/components/contacts-table'
import ErrorBoundary from '@/components/error-boundary'

export default function ContactsPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <ErrorBoundary>
      <AppShell title="Contacts" onAddContact={() => setModalOpen(true)}>
        <ContactsTable modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </AppShell>
    </ErrorBoundary>
  )
}

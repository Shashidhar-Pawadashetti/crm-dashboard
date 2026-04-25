'use client'

import { useState } from 'react'
import AppShell from '@/components/app-shell'
import ContactsTable from '@/components/contacts-table'

export default function ContactsPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <AppShell title="Contacts" onAddContact={() => setModalOpen(true)}>
      <ContactsTable modalOpen={modalOpen} setModalOpen={setModalOpen} />
    </AppShell>
  )
}

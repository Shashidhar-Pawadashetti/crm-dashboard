'use client'

import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'

export default function AppShell({
  children,
  title,
  onAddContact,
}: {
  children: React.ReactNode
  title: string
  onAddContact?: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        <Header
          title={title}
          onAddContact={onAddContact}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

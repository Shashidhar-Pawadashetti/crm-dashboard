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

      <div className="relative flex min-h-screen flex-col lg:ml-[240px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-primary/10 to-transparent" />
        <Header
          title={title}
          onAddContact={onAddContact}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="relative z-10 flex-1 py-5 sm:py-6 lg:py-8">
          <div className="page-enter mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

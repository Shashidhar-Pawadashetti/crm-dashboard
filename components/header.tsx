'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Plus, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header({
  title,
  onAddContact,
  onToggleSidebar,
}: {
  title: string
  onAddContact?: () => void
  onToggleSidebar: () => void
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark mode toggle */}
        {mounted && (
          <button
            id="dark-mode-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 sm:p-2.5 rounded-xl bg-accent hover:bg-border text-muted-foreground hover:text-foreground transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>
        )}

        {/* Add Contact button */}
        {onAddContact && (
          <button
            id="add-contact-btn"
            onClick={onAddContact}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        )}
      </div>
    </header>
  )
}

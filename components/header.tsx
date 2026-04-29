'use client'

import { useTheme } from './theme-provider'
import { Sun, Moon, Plus, Menu } from 'lucide-react'

export default function Header({
  title,
  onAddContact,
  onToggleSidebar,
}: {
  title: string
  onAddContact?: () => void
  onToggleSidebar: () => void
}) {
  const { theme, resolvedTheme, mounted, setTheme } = useTheme()
  const isDark =
    mounted && (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-card/65 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="-ml-1 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            id="dark-mode-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-xl bg-accent p-2.5 text-muted-foreground transition-all duration-200 hover:bg-border hover:text-foreground sm:p-3"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {onAddContact && (
            <button
              id="add-contact-btn"
              onClick={onAddContact}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/45 active:scale-95 sm:px-5 sm:py-3"
              aria-label="Add contact"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

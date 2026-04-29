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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/65 px-4 backdrop-blur-xl sm:px-6 w-full">
      <div className="flex h-16 w-full items-center justify-between max-w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="dark-mode-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-xl bg-accent p-2.5 text-muted-foreground transition-all duration-200 hover:bg-border hover:text-foreground sm:p-3"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>

          {onAddContact && (
            <button
              id="add-contact-btn"
              onClick={onAddContact}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/45 active:scale-95 sm:px-5 sm:py-3"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

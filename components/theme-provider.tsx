'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  mounted: boolean
  setTheme: (nextTheme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem('theme')
      if (
        storedTheme === 'light' ||
        storedTheme === 'dark' ||
        storedTheme === 'system'
      ) {
        setThemeState(storedTheme)
      }
      setMounted(true)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateResolvedTheme = () => {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    if (theme === 'system') {
      updateResolvedTheme()
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => {
        mediaQuery.removeEventListener('change', updateResolvedTheme)
      }
    }

    const timeoutId = window.setTimeout(() => {
      setResolvedTheme(theme)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      mounted,
      setTheme: (nextTheme: Theme) => {
        setThemeState(nextTheme)
        window.localStorage.setItem('theme', nextTheme)
      },
    }),
    [mounted, resolvedTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.')
  }
  return context
}

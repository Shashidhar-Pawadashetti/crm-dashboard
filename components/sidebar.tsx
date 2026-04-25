'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  BarChart3,
  Settings,
  X,
  Zap,
} from 'lucide-react'

const navItems = [
  { name: 'Contacts', href: '/', icon: Users },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden overlay-fade"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[240px]
          bg-sidebar flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Nex<span className="text-indigo-400">CRM</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground hover:text-white hover:bg-sidebar-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'bg-indigo-500/15 text-white'
                      : 'text-sidebar-foreground hover:text-white hover:bg-sidebar-hover'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-active rounded-r-full" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    isActive ? 'text-sidebar-active' : 'text-sidebar-foreground group-hover:text-white'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/10">
          <p className="text-xs font-medium text-indigo-300 mb-1">Pro Plan</p>
          <p className="text-[11px] text-sidebar-foreground leading-relaxed">
            Unlimited contacts and advanced analytics
          </p>
          <div className="mt-2.5 h-1.5 bg-sidebar-hover rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          </div>
        </div>
      </aside>
    </>
  )
}

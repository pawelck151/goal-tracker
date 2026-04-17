'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import SidebarNav from './SidebarNav'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Goal Tracker
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className="p-2 -mr-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <SidebarNav />
          <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
              >
                Wyloguj
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 min-h-screen bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-stone-200 dark:border-stone-800">
          <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Goal Tracker
          </span>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3">
          <ThemeToggle />
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
            >
              Wyloguj
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

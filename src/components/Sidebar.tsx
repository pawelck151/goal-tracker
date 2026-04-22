'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import SidebarNav from './SidebarNav'
import ThemeToggle from './ThemeToggle'
import { Logo } from './Logo'
import { UserAvatar } from './UserAvatar'

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Wyloguj"
        title="Wyloguj"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </form>
  )
}

function UserInfo({ email, collapsed }: { email: string; collapsed: boolean }) {
  return (
    <div
      className={`border-b border-stone-200 dark:border-stone-800 py-3 flex items-center gap-2 ${
        collapsed ? 'px-2 justify-center' : 'px-4'
      }`}
    >
      <UserAvatar email={email} size="sm" />
      {!collapsed && (
        <span
          className="text-xs text-stone-500 dark:text-stone-400 truncate"
          title={email}
        >
          {email}
        </span>
      )}
    </div>
  )
}

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    if (stored === '1') setCollapsed(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0')
  }, [collapsed, mounted])

  useEffect(() => {
    if (open) setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onEsc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = prev
    }
  }, [open])

  const desktopWidth = collapsed ? 'md:w-16' : 'md:w-56'

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <Logo size="sm" href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Otwórz menu"
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
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[90%] max-w-md bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-stone-200 dark:border-stone-800">
              <Logo size="sm" href="/dashboard" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zamknij menu"
                className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <UserInfo email={userEmail} collapsed={false} />

            <SidebarNav collapsed={false} large />

            <div className="border-t border-stone-200 dark:border-stone-800 py-4 px-4 flex items-center justify-between">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${desktopWidth} min-h-screen bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex-col flex-shrink-0 transition-[width] duration-200`}
      >
        <div
          className={`py-5 border-b border-stone-200 dark:border-stone-800 flex ${
            collapsed ? 'px-2 justify-center' : 'px-4'
          }`}
        >
          <Logo size="sm" href="/dashboard" wordmark={!collapsed} />
        </div>

        <UserInfo email={userEmail} collapsed={collapsed} />

        <SidebarNav collapsed={collapsed} />

        <div
          className={`border-t border-stone-200 dark:border-stone-800 py-3 flex items-center ${
            collapsed
              ? 'flex-col gap-1 px-2'
              : 'flex-row gap-1 px-3 justify-between'
          }`}
        >
          <ThemeToggle iconOnly={collapsed} />
          <LogoutButton />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
            title={collapsed ? 'Rozwiń' : 'Zwiń'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}

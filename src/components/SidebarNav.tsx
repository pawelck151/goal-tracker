'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/goals/new', label: 'Nowy cel', icon: '+' },
  { href: '/settings', label: 'Ustawienia', icon: '⚙' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 py-3 flex flex-col gap-0.5">
      {NAV.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

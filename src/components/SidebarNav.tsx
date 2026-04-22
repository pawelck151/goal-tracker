'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type IconName = 'dashboard' | 'plus' | 'settings'

function NavIcon({ name, large }: { name: IconName; large?: boolean }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `${large ? 'w-6 h-6' : 'w-[18px] h-[18px]'} flex-shrink-0`,
  }
  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    )
  }
  if (name === 'plus') {
    return (
      <svg {...common}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/goals/new', label: 'Nowy cel', icon: 'plus' },
  { href: '/settings', label: 'Ustawienia', icon: 'settings' },
]

export default function SidebarNav({
  collapsed = false,
  large = false,
}: {
  collapsed?: boolean
  large?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav className={`flex-1 flex flex-col ${large ? 'py-4 gap-1.5' : 'py-3 gap-0.5'}`}>
      {NAV.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center transition-colors ${
              collapsed
                ? 'px-2 justify-center gap-3 py-2 mx-2 text-sm rounded-lg'
                : large
                ? 'px-4 gap-4 py-3.5 mx-3 text-base rounded-xl'
                : 'px-3 gap-3 py-2 mx-2 text-sm rounded-lg'
            } ${
              isActive
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
            }`}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className={`absolute left-0 rounded-r-full bg-amber-600 dark:bg-amber-400 ${
                  large ? 'top-2 bottom-2 w-[4px]' : 'top-1.5 bottom-1.5 w-[3px]'
                }`}
              />
            )}
            <NavIcon name={item.icon} large={large} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

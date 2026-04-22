type Size = 'sm' | 'md'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-sm',
}

function initials(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase() || '?'
}

export function UserAvatar({ email, size = 'sm' }: { email: string; size?: Size }) {
  return (
    <span
      aria-hidden="true"
      className={`${SIZE_CLASS[size]} rounded-full flex-shrink-0 flex items-center justify-center font-semibold bg-amber-800 dark:bg-amber-400 text-white dark:text-stone-900`}
    >
      {initials(email)}
    </span>
  )
}

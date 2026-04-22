import Link from 'next/link'

type Size = 'sm' | 'md' | 'lg'

const ICON_SIZE: Record<Size, number> = { sm: 22, md: 28, lg: 40 }
const TEXT_CLASS: Record<Size, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-xl font-bold',
}
const GAP_CLASS: Record<Size, string> = { sm: 'gap-2', md: 'gap-2.5', lg: 'gap-3' }
const RADIUS: Record<Size, number> = { sm: 5, md: 6, lg: 8 }

export type LogoProps = {
  size?: Size
  wordmark?: boolean
  wordmarkText?: string
  href?: string
  className?: string
}

export function Logo({
  size = 'sm',
  wordmark = true,
  wordmarkText = 'Goal Tracker',
  href,
  className = '',
}: LogoProps) {
  const px = ICON_SIZE[size]
  const radius = RADIUS[size]

  const content = (
    <span className={`inline-flex items-center ${GAP_CLASS[size]} ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={px}
        height={px}
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx={radius}
          className="fill-amber-800 dark:fill-amber-400"
        />
        <text
          x="16"
          y="23"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="fill-white dark:fill-stone-900"
        >
          G
        </text>
      </svg>
      {wordmark && (
        <span
          className={`${TEXT_CLASS[size]} tracking-tight text-stone-900 dark:text-stone-100`}
        >
          {wordmarkText}
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label={wordmarkText}>
        {content}
      </Link>
    )
  }
  return content
}

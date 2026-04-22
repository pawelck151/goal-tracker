import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">{children}</div>
      </main>
      <Link
        href="/goals/new"
        aria-label="Dodaj cel"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white shadow-lg shadow-amber-900/30 flex items-center justify-center transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}

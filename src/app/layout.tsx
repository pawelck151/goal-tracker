import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Goal Tracker',
  description: 'Personal goal tracking app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={geist.className}>
      <body className="bg-stone-100 min-h-screen">{children}</body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import { Logo } from '@/components/Logo'

const inputClass =
  'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center mb-6">
          Zaloguj się aby kontynuować
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="email@example.com"
            autoComplete="email"
            required
            autoFocus
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Hasło"
            autoComplete="current-password"
            required
            className={inputClass}
          />
          {state?.error && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center mt-6">
          Nie masz konta?{' '}
          <Link href="/register" className="text-amber-800 dark:text-amber-300 hover:underline">
            Załóż konto
          </Link>
        </p>
      </div>
    </div>
  )
}

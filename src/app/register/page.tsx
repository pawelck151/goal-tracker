'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '@/actions/auth'

const inputClass =
  'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, null)

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mb-1 text-center">
          Załóż konto
        </h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center mb-6">
          Zacznij śledzić swoje cele
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
            placeholder="Hasło (min. 8 znaków)"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
          <input
            type="password"
            name="confirm"
            placeholder="Powtórz hasło"
            autoComplete="new-password"
            required
            minLength={8}
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
            {pending ? 'Tworzenie...' : 'Utwórz konto'}
          </button>
        </form>
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center mt-6">
          Masz już konto?{' '}
          <Link href="/login" className="text-amber-800 dark:text-amber-300 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}

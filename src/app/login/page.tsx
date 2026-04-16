'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-1 text-center">
          Goal Tracker
        </h1>
        <p className="text-sm text-stone-400 text-center mb-6">Wprowadź PIN aby kontynuować</p>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="pin"
            placeholder="••••••"
            autoFocus
            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          />
          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-amber-800 hover:bg-amber-900 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </div>
  )
}

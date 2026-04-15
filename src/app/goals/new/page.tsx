'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGoal } from '@/actions/goals'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'work', label: 'Praca' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'learning', label: 'Nauka' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'finance', label: 'Finanse' },
]

export default function NewGoalPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createGoal, null)

  useEffect(() => {
    if (state?.goalId) {
      // Fire and forget — generates tasks in background
      fetch(`/api/goals/${state.goalId}/generate-tasks`, { method: 'POST' })
      router.push('/dashboard')
    }
  }, [state?.goalId, router])

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Nowy cel</h1>
      </div>

      <form action={formAction} className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa celu</label>
          <input
            type="text"
            name="title"
            required
            placeholder="np. Nauczyć się TypeScript"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
          <select
            name="category"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis{' '}
            <span className="text-gray-400 font-normal">
              (dla AI — im więcej szczegółów, tym lepsze zadania)
            </span>
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Opisz cel szczegółowo: co chcesz osiągnąć, jaki masz poziom, jakie masz zasoby..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data startu</label>
            <input
              type="date"
              name="startDate"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              name="deadline"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
        >
          {pending ? 'Tworzenie...' : 'Utwórz cel'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { GoalFormState } from '@/actions/goals'

const CATEGORIES = [
  { value: 'work', label: 'Praca' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'learning', label: 'Nauka' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'finance', label: 'Finanse' },
]

const inputClass =
  'w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 disabled:opacity-60 disabled:cursor-not-allowed'

export type GoalFormInitial = {
  title: string
  category: string
  description: string
  startDate: Date
  deadline: Date
}

type Props = {
  action: (prev: GoalFormState, formData: FormData) => Promise<GoalFormState>
  initial?: GoalFormInitial
  heading: string
  submitLabel: string
  submitPendingLabel: string
  errorTitle: string
}

function toDateInput(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

function startOfToday(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

export function GoalForm({
  action,
  initial,
  heading,
  submitLabel,
  submitPendingLabel,
  errorTitle,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state && 'error' in state) {
      toast.error(errorTitle, { description: state.error })
    }
  }, [state, errorTitle])

  const startLocked =
    !!initial && new Date(initial.startDate) < startOfToday()
  const todayStr = toDateInput(startOfToday())

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {heading}
        </h1>
        <Link
          href="/dashboard"
          aria-label="Zamknij"
          className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
      </div>

      <form
        action={formAction}
        className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Nazwa celu
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={initial?.title}
            placeholder="np. Nauczyć się TypeScript"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Kategoria
          </label>
          <select
            name="category"
            required
            defaultValue={initial?.category}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Opis{' '}
            <span className="text-stone-400 dark:text-stone-500 font-normal">
              (dla AI — im więcej szczegółów, tym lepsze zadania)
            </span>
          </label>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={initial?.description}
            placeholder="Opisz cel szczegółowo: co chcesz osiągnąć, jaki masz poziom, jakie masz zasoby..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Data startu
            </label>
            <input
              type="date"
              name="startDate"
              required
              defaultValue={initial ? toDateInput(initial.startDate) : undefined}
              min={initial ? undefined : todayStr}
              disabled={startLocked}
              className={inputClass}
            />
            {startLocked && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Data startu już minęła — nie można edytować.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              required
              defaultValue={initial ? toDateInput(initial.deadline) : undefined}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors mt-1"
        >
          {pending ? submitPendingLabel : submitLabel}
        </button>
      </form>
    </div>
  )
}

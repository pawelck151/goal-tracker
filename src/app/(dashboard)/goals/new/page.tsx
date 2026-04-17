'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createGoal } from '@/actions/goals'

const CATEGORIES = [
  { value: 'work', label: 'Praca' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'learning', label: 'Nauka' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'finance', label: 'Finanse' },
]

const inputClass =
  'w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default function NewGoalPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createGoal, null)

  useEffect(() => {
    if (!state) return
    if ('error' in state) {
      toast.error('Nie udało się utworzyć celu', { description: state.error })
      return
    }
    if (!('goalId' in state)) return
    const goalId = state.goalId
    toast.success('Cel utworzony', { description: 'Generuję zadania w tle...' })
    router.push('/dashboard')
    ;(async () => {
      try {
        const res = await fetch(`/api/goals/${goalId}/generate-tasks`, {
          method: 'POST',
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          const detail =
            (body && (body.detail || body.error)) || `HTTP ${res.status}`
          toast.error('Nie udało się wygenerować zadań', { description: detail })
        } else {
          toast.success('Zadania wygenerowane', {
            description: `${body?.count ?? '?'} zadań`,
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        toast.error('Błąd sieci przy generowaniu zadań', { description: msg })
      }
    })()
  }, [state, router])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mb-8">
        Nowy cel
      </h1>

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
            placeholder="np. Nauczyć się TypeScript"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Kategoria
          </label>
          <select name="category" required className={inputClass}>
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
            placeholder="Opisz cel szczegółowo: co chcesz osiągnąć, jaki masz poziom, jakie masz zasoby..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Data startu
            </label>
            <input type="date" name="startDate" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Deadline
            </label>
            <input type="date" name="deadline" required className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors mt-1"
        >
          {pending ? 'Tworzenie...' : 'Utwórz cel'}
        </button>
      </form>
    </div>
  )
}

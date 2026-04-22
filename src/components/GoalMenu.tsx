'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteGoal } from '@/actions/goals'

export function GoalMenu({ goalId, goalTitle }: { goalId: string; goalTitle: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  function handleDelete() {
    setOpen(false)
    const ok = window.confirm(
      `Usunąć cel „${goalTitle}"? Akcja nieodwracalna — zadania i historia zostaną skasowane.`
    )
    if (!ok) return
    startTransition(async () => {
      const res = await deleteGoal(goalId)
      if (res.error) {
        toast.error('Nie udało się usunąć celu', { description: res.error })
      } else {
        toast.success('Cel usunięty')
      }
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu celu"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg py-1 z-10"
        >
          <Link
            href={`/goals/${goalId}/edit`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Edytuj
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Usuń
          </button>
        </div>
      )}
    </div>
  )
}

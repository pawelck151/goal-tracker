'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function TaskGenerationTrigger({ goalIds }: { goalIds: string[] }) {
  const router = useRouter()
  const fired = useRef<Set<string>>(new Set())

  useEffect(() => {
    const pending = goalIds.filter((id) => !fired.current.has(id))
    if (pending.length === 0) return
    pending.forEach((id) => fired.current.add(id))

    let cancelled = false
    ;(async () => {
      let anyGenerated = false
      for (const id of pending) {
        try {
          const res = await fetch(`/api/goals/${id}/generate-tasks`, {
            method: 'POST',
          })
          const body = await res.json().catch(() => null)
          if (cancelled) return
          if (!res.ok) {
            const detail =
              (body && (body.detail || body.error)) || `HTTP ${res.status}`
            toast.error('Nie udało się wygenerować zadań', { description: detail })
          } else if (body?.count) {
            anyGenerated = true
            toast.success('Zadania wygenerowane', {
              description: `${body.count} zadań`,
            })
          }
        } catch (err) {
          if (cancelled) return
          const msg = err instanceof Error ? err.message : String(err)
          toast.error('Błąd sieci przy generowaniu zadań', { description: msg })
        }
      }
      if (anyGenerated && !cancelled) router.refresh()
    })()

    return () => {
      cancelled = true
    }
  }, [goalIds, router])

  return null
}

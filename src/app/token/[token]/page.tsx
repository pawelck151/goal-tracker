import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateTaskStatus } from '@/actions/tasks'
import type { DailyLogStatus } from '@prisma/client'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export default async function TokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const dailyToken = await prisma.dailyToken.findUnique({ where: { token } })

  if (!dailyToken || dailyToken.expiresAt < new Date()) {
    notFound()
  }

  if (!dailyToken.usedAt) {
    await prisma.dailyToken.update({
      where: { id: dailyToken.id },
      data: { usedAt: new Date() },
    })
  }

  const today = new Date()
  const tasks = await prisma.task.findMany({
    where: {
      scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
      goal: { userId: dailyToken.userId, isActive: true },
    },
    include: {
      dailyLogs: { where: { date: { gte: startOfDay(today), lte: endOfDay(today) } } },
      goal: { select: { title: true, category: true } },
    },
    orderBy: { order: 'asc' },
  })

  const done = tasks.filter((t) => t.dailyLogs[0]?.status === 'DONE').length

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Zadania na dziś
          </h1>
          <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
            {done}/{tasks.length} wykonanych ·{' '}
            {today.toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {tasks.map((task) => {
            const status = task.dailyLogs[0]?.status as DailyLogStatus | undefined
            return (
              <div
                key={task.id}
                className={`bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 border-l-4 ${
                  status === 'DONE'
                    ? 'border-l-green-400'
                    : status === 'SKIPPED'
                    ? 'border-l-stone-300 dark:border-l-stone-700'
                    : 'border-l-amber-500'
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  {task.goal.category} · {task.goal.title}
                </div>
                <p
                  className={`text-sm font-medium mb-3 ${
                    status === 'DONE' ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex gap-2">
                  <form action={updateTaskStatus.bind(null, task.id, 'DONE')}>
                    <button
                      type="submit"
                      className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        status === 'DONE'
                          ? 'bg-green-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-green-50 hover:text-green-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-green-950/50 dark:hover:text-green-300'
                      }`}
                    >
                      ✓ Zrobione
                    </button>
                  </form>
                  <form action={updateTaskStatus.bind(null, task.id, 'SKIPPED')}>
                    <button
                      type="submit"
                      className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        status === 'SKIPPED'
                          ? 'bg-stone-400 dark:bg-stone-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                      }`}
                    >
                      Pominięte
                    </button>
                  </form>
                </div>
              </div>
            )
          })}

          {tasks.length === 0 && (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12">Brak zadań na dziś.</p>
          )}
        </div>
      </div>
    </div>
  )
}

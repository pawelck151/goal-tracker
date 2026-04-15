import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateTaskStatus } from '@/actions/tasks'
import type { DailyLogStatus } from '@/generated/prisma/client'

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
      dailyLogs: { where: { date: { gte: startOfDay(today) } } },
      goal: { select: { title: true, category: true } },
    },
    orderBy: { order: 'asc' },
  })

  const done = tasks.filter((t) => t.dailyLogs[0]?.status === 'DONE').length

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Zadania na dziś</h1>
      <p className="text-gray-500 mb-6">
        {done}/{tasks.length} wykonanych ·{' '}
        {today.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>

      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const status = task.dailyLogs[0]?.status as DailyLogStatus | undefined
          return (
            <div
              key={task.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                status === 'DONE'
                  ? 'border-green-400'
                  : status === 'SKIPPED'
                  ? 'border-gray-300'
                  : 'border-blue-400'
              }`}
            >
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {task.goal.category} · {task.goal.title}
              </div>
              <p
                className={`font-medium ${
                  status === 'DONE' ? 'line-through text-gray-400' : ''
                }`}
              >
                {task.title}
              </p>
              <div className="flex gap-2 mt-3">
                <form action={updateTaskStatus.bind(null, task.id, 'DONE', dailyToken.userId)}>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                      status === 'DONE'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    ✓ Zrobione
                  </button>
                </form>
                <form
                  action={updateTaskStatus.bind(null, task.id, 'SKIPPED', dailyToken.userId)}
                >
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                      status === 'SKIPPED'
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <p className="text-center text-gray-400 py-12">Brak zadań na dziś.</p>
        )}
      </div>
    </div>
  )
}

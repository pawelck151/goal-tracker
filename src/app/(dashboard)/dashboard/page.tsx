import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

async function getStreak(userId: string): Promise<boolean[]> {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId,
      status: 'DONE',
      date: { gte: startOfDay(days[0]), lte: endOfDay(today) },
    },
  })

  return days.map((day) =>
    logs.some(
      (log) => startOfDay(log.date).getTime() === startOfDay(day).getTime()
    )
  )
}

const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

export default async function DashboardPage() {
  const user = await prisma.user.findFirst()
  if (!user) {
    return (
      <p className="p-8 text-center text-stone-500">
        Brak użytkownika. Uruchom: <code>npx prisma db seed</code>
      </p>
    )
  }

  const today = new Date()

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      tasks: {
        where: {
          scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        include: {
          dailyLogs: { where: { date: { gte: startOfDay(today) } } },
        },
        orderBy: { order: 'asc' },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const streak = await getStreak(user.id)
  const todayTasks = goals.flatMap((g) => g.tasks)
  const doneTasks = todayTasks.filter((t) => t.dailyLogs[0]?.status === 'DONE')

  const streakDayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Dashboard
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-stone-900">{goals.length}</div>
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mt-1">
            Aktywne cele
          </div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-stone-900">
            {doneTasks.length}/{todayTasks.length}
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mt-1">
            Dziś ukończone
          </div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-3">
            Streak (7 dni)
          </div>
          <div className="flex gap-1.5">
            {streak.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full ${
                    active ? 'bg-amber-500' : 'bg-stone-200'
                  }`}
                />
                <span className="text-xs text-stone-400">{streakDayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-4">
        {goals.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            Brak celów.{' '}
            <Link href="/goals/new" className="text-amber-800 hover:underline">
              Dodaj pierwszy cel
            </Link>
          </div>
        )}
        {goals.map((goal) => {
          const total = goal.tasks.length
          const done = goal.tasks.filter(
            (t) => t.dailyLogs[0]?.status === 'DONE'
          ).length
          const progress = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <div
              key={goal.id}
              className="bg-stone-50 border border-stone-200 rounded-2xl p-6 border-l-4 border-l-amber-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    {goal.category}
                  </span>
                  <h2 className="text-lg font-semibold text-stone-900 mt-0.5">
                    {goal.title}
                  </h2>
                </div>
                <span className="text-sm text-stone-400 mt-0.5">
                  do {new Date(goal.deadline).toLocaleDateString('pl-PL')}
                </span>
              </div>

              <div className="w-full bg-stone-200 rounded-full h-1.5 mb-1">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 mb-3">{progress}% ukończone</p>

              {!goal.tasksGenerated ? (
                <p className="text-sm text-stone-400 italic">Generowanie zadań...</p>
              ) : goal.tasks.length === 0 ? (
                <p className="text-sm text-stone-400">Brak zadań na dziś</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {goal.tasks.map((task) => {
                    const status = task.dailyLogs[0]?.status
                    return (
                      <li key={task.id} className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            status === 'DONE'
                              ? 'bg-green-500'
                              : status === 'SKIPPED'
                              ? 'bg-stone-300'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            status === 'DONE'
                              ? 'line-through text-stone-400'
                              : status === 'SKIPPED'
                              ? 'text-stone-400'
                              : 'text-stone-700'
                          }`}
                        >
                          {task.title}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

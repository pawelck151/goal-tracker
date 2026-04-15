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

export default async function DashboardPage() {
  const user = await prisma.user.findFirst()
  if (!user) {
    return (
      <p className="p-8 text-center text-gray-500">
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/goals/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Nowy cel
          </Link>
          <Link href="/settings" className="text-gray-500 text-sm hover:text-gray-700 self-center">
            Ustawienia
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">{goals.length}</div>
          <div className="text-sm text-gray-500 mt-1">Aktywne cele</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600">
            {doneTasks.length}/{todayTasks.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Dziś ukończone</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Streak (7 dni)</div>
          <div className="flex gap-1">
            {streak.map((active, i) => (
              <div
                key={i}
                className={`h-5 w-5 rounded-sm ${active ? 'bg-green-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-4">
        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Brak celów.{' '}
            <Link href="/goals/new" className="text-blue-600 hover:underline">
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
            <div key={goal.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {goal.category}
                  </span>
                  <h2 className="font-semibold text-lg">{goal.title}</h2>
                </div>
                <span className="text-sm text-gray-400">
                  do {new Date(goal.deadline).toLocaleDateString('pl-PL')}
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {!goal.tasksGenerated ? (
                <p className="text-sm text-gray-400 italic">Generowanie zadań...</p>
              ) : goal.tasks.length === 0 ? (
                <p className="text-sm text-gray-400">Brak zadań na dziś</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {goal.tasks.map((task) => {
                    const status = task.dailyLogs[0]?.status
                    return (
                      <li
                        key={task.id}
                        className={`text-sm flex items-center gap-2 ${
                          status === 'DONE' ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            status === 'DONE'
                              ? 'bg-green-400'
                              : status === 'SKIPPED'
                              ? 'bg-gray-300'
                              : 'bg-blue-400'
                          }`}
                        />
                        {task.title}
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

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TaskGenerationTrigger } from './TaskGenerationTrigger'

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
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const today = new Date()

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      tasks: {
        where: {
          scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        include: {
          dailyLogs: { where: { date: { gte: startOfDay(today), lte: endOfDay(today) } } },
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

  const ungeneratedGoalIds = goals
    .filter((g) => !g.tasksGenerated)
    .map((g) => g.id)

  return (
    <div>
      <TaskGenerationTrigger goalIds={ungeneratedGoalIds} />
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Dashboard
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 md:p-8 text-center flex flex-col justify-center">
          <div className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100">{goals.length}</div>
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-2">
            Aktywne cele
          </div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 md:p-8 text-center flex flex-col justify-center">
          <div className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100">
            {doneTasks.length}/{todayTasks.length}
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-2">
            Dziś ukończone
          </div>
        </div>
        <div className="col-span-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 md:p-8 flex flex-col justify-center">
          <div className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 md:mb-4">
            Streak (7 dni)
          </div>
          <div className="flex gap-1.5 sm:gap-3 justify-between">
            {streak.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full ${
                    active ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'
                  }`}
                />
                <span className="text-xs text-stone-400 dark:text-stone-500">{streakDayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-4">
        {goals.length === 0 && (
          <div className="text-center py-12 text-stone-400 dark:text-stone-500">
            Brak celów.{' '}
            <Link href="/goals/new" className="text-amber-800 dark:text-amber-300 hover:underline">
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
              className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 md:p-6 border-l-4 border-l-amber-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3">
                <div className="min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {goal.category}
                  </span>
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-0.5 break-words">
                    {goal.title}
                  </h2>
                </div>
                <span className="text-sm text-stone-400 dark:text-stone-500 sm:mt-0.5 whitespace-nowrap">
                  do {new Date(goal.deadline).toLocaleDateString('pl-PL')}
                </span>
              </div>

              <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 mb-1">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">{progress}% ukończone</p>

              {!goal.tasksGenerated ? (
                <p className="text-sm text-stone-400 dark:text-stone-500 italic">Generowanie zadań...</p>
              ) : goal.tasks.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-500">Brak zadań na dziś</p>
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
                              ? 'bg-stone-300 dark:bg-stone-700'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            status === 'DONE'
                              ? 'line-through text-stone-400 dark:text-stone-500'
                              : status === 'SKIPPED'
                              ? 'text-stone-400 dark:text-stone-500'
                              : 'text-stone-700 dark:text-stone-300'
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

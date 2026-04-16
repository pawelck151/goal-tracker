# Redesign — Notion Warm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blue/gray UI with a warm cream/stone/amber design and add a fixed left sidebar replacing header navigation links.

**Architecture:** Create a `(dashboard)` route group with its own layout that renders the Sidebar. Move the three protected pages into this group. Restyle all pages in-place — zero logic changes, only className updates and structural additions.

**Tech Stack:** Next.js 16.2.3 App Router, Tailwind CSS v4, TypeScript

---

## File Map

| File | Action |
|---|---|
| `src/components/Sidebar.tsx` | Create — sidebar Server Component with nav + logout |
| `src/app/(dashboard)/layout.tsx` | Create — wraps children with Sidebar |
| `src/app/(dashboard)/dashboard/page.tsx` | Create — restyled dashboard (replaces `src/app/dashboard/page.tsx`) |
| `src/app/(dashboard)/goals/new/page.tsx` | Create — restyled new goal page (replaces `src/app/goals/new/page.tsx`) |
| `src/app/(dashboard)/settings/page.tsx` | Create — restyled settings page (replaces `src/app/settings/page.tsx`) |
| `src/app/dashboard/page.tsx` | Delete |
| `src/app/goals/new/page.tsx` | Delete |
| `src/app/settings/page.tsx` | Delete |
| `src/app/login/page.tsx` | Modify — restyle only |
| `src/app/token/[token]/page.tsx` | Modify — restyle only |
| `src/app/layout.tsx` | Modify — body background to `bg-stone-100` |

---

### Task 1: Sidebar component and dashboard layout

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create `src/components/Sidebar.tsx`**

```tsx
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/goals/new', label: 'Nowy cel', icon: '+' },
  { href: '/settings', label: 'Ustawienia', icon: '⚙' },
]

export default function Sidebar({ active }: { active: string }) {
  return (
    <aside className="w-56 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-stone-200">
        <span className="text-sm font-semibold text-stone-900 tracking-tight">
          Goal Tracker
        </span>
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const isActive = active === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-800 font-medium'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-stone-200">
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Wyloguj
          </button>
        </form>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `src/app/(dashboard)/layout.tsx`**

```tsx
import { headers } from 'next/headers'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/dashboard'

  return (
    <div className="flex min-h-screen">
      <Sidebar active={pathname} />
      <main className="flex-1 bg-stone-100">
        <div className="max-w-3xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
```

> **Note:** `x-pathname` is not a standard header. Next.js doesn't expose the current pathname to Server Components via headers out-of-the-box. The sidebar will render without an active state initially — that's acceptable for this app. If active state highlighting doesn't work via headers, remove the `active` prop logic and use a `'use client'` wrapper around the nav links with `usePathname()` instead. See the note in Step 3.

- [ ] **Step 3: Fix active nav state — make Sidebar nav a Client Component**

Because Server Components can't use `usePathname()`, extract only the nav list into a Client Component. Replace `src/components/Sidebar.tsx` with:

```tsx
import { logoutAction } from '@/actions/auth'
import SidebarNav from './SidebarNav'

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-stone-200">
        <span className="text-sm font-semibold text-stone-900 tracking-tight">
          Goal Tracker
        </span>
      </div>

      <SidebarNav />

      <div className="px-4 py-4 border-t border-stone-200">
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Wyloguj
          </button>
        </form>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Create `src/components/SidebarNav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/goals/new', label: 'Nowy cel', icon: '+' },
  { href: '/settings', label: 'Ustawienia', icon: '⚙' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 py-3 flex flex-col gap-0.5">
      {NAV.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-amber-50 text-amber-800 font-medium'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 5: Simplify `src/app/(dashboard)/layout.tsx`** (remove headers import — not needed)

```tsx
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-stone-100">
        <div className="max-w-3xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Update root layout body background**

In `src/app/layout.tsx`, change:
```tsx
<body className="bg-gray-50 min-h-screen">{children}</body>
```
to:
```tsx
<body className="bg-stone-100 min-h-screen">{children}</body>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/Sidebar.tsx src/components/SidebarNav.tsx src/app/\(dashboard\)/layout.tsx src/app/layout.tsx
git commit -m "feat: sidebar component and dashboard route group layout"
```

---

### Task 2: Dashboard page — restyle and move to route group

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Delete: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/dashboard/page.tsx`**

All data-fetching logic is identical to the original. Only classNames change. Remove the header links (they move to sidebar) and the logout button.

```tsx
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

  // day-of-week labels aligned to last 7 days
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
```

- [ ] **Step 2: Delete old dashboard page**

```bash
git rm src/app/dashboard/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: restyle dashboard page, move to route group"
```

---

### Task 3: New goal page — restyle and move

**Files:**
- Create: `src/app/(dashboard)/goals/new/page.tsx`
- Delete: `src/app/goals/new/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/goals/new/page.tsx`**

All logic identical to original. Remove back-arrow link (sidebar handles navigation). Update classNames.

```tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGoal } from '@/actions/goals'

const CATEGORIES = [
  { value: 'work', label: 'Praca' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'learning', label: 'Nauka' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'finance', label: 'Finanse' },
]

const inputClass =
  'w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default function NewGoalPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createGoal, null)

  useEffect(() => {
    if (state?.goalId) {
      fetch(`/api/goals/${state.goalId}/generate-tasks`, { method: 'POST' })
      router.push('/dashboard')
    }
  }, [state?.goalId, router])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-8">
        Nowy cel
      </h1>

      <form
        action={formAction}
        className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
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
          <label className="block text-sm font-medium text-stone-700 mb-1">
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
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Opis{' '}
            <span className="text-stone-400 font-normal">
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
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Data startu
            </label>
            <input type="date" name="startDate" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Deadline
            </label>
            <input type="date" name="deadline" required className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-amber-800 hover:bg-amber-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors mt-1"
        >
          {pending ? 'Tworzenie...' : 'Utwórz cel'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Delete old page**

```bash
git rm src/app/goals/new/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/goals/new/page.tsx
git commit -m "feat: restyle new goal page, move to route group"
```

---

### Task 4: Settings page — restyle and move

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Delete: `src/app/settings/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/settings/page.tsx`**

```tsx
import { prisma } from '@/lib/prisma'
import { updateSettings } from '@/actions/settings'

const TIMEZONES = [
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
]

const inputClass =
  'w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600'

export default async function SettingsPage() {
  const user = await prisma.user.findFirst()
  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-8">
        Ustawienia
      </h1>

      <form
        action={updateSettings}
        className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email poranny
            </label>
            <input
              type="time"
              name="morningTime"
              defaultValue={user.morningTime}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email wieczorny
            </label>
            <input
              type="time"
              name="eveningTime"
              defaultValue={user.eveningTime}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Strefa czasowa
          </label>
          <select name="timezone" defaultValue={user.timezone} className={inputClass}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-amber-800 hover:bg-amber-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Zapisz ustawienia
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Delete old page**

```bash
git rm src/app/settings/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/settings/page.tsx
git commit -m "feat: restyle settings page, move to route group"
```

---

### Task 5: Login page — restyle

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Replace `src/app/login/page.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-1 text-center">
          Goal Tracker
        </h1>
        <p className="text-sm text-stone-400 text-center mb-6">Wprowadź PIN aby kontynuować</p>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="pin"
            placeholder="••••••"
            autoFocus
            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          />
          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-amber-800 hover:bg-amber-900 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: restyle login page — warm stone theme"
```

---

### Task 6: Token page — restyle

**Files:**
- Modify: `src/app/token/[token]/page.tsx`

- [ ] **Step 1: Replace `src/app/token/[token]/page.tsx`**

```tsx
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
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Zadania na dziś
          </h1>
          <p className="text-sm text-stone-400 mt-1">
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
                className={`bg-stone-50 border border-stone-200 rounded-2xl p-5 border-l-4 ${
                  status === 'DONE'
                    ? 'border-l-green-500'
                    : status === 'SKIPPED'
                    ? 'border-l-stone-300'
                    : 'border-l-amber-500'
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-1">
                  {task.goal.category} · {task.goal.title}
                </div>
                <p
                  className={`text-sm font-medium mb-3 ${
                    status === 'DONE' ? 'line-through text-stone-400' : 'text-stone-900'
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
                          : 'bg-stone-100 text-stone-700 hover:bg-green-50 hover:text-green-700'
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
                          ? 'bg-stone-400 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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
            <p className="text-center text-stone-400 py-12">Brak zadań na dziś.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/token/
git commit -m "feat: restyle token page — warm stone theme"
```

---

## Post-implementation verification

After all tasks:

- [ ] Run `npx tsc --noEmit` — expect 0 errors
- [ ] Run `npm test` — expect 6/6 tests passing
- [ ] Open `http://localhost:3000` and verify:
  - Login page has cream background and warm card
  - Dashboard has left sidebar with active state on Dashboard
  - Sidebar shows Nowy cel / Ustawienia links and Wyloguj button
  - Goal cards have amber left stripe and warm background
  - Streak shows circles with day labels
  - New goal form has stone styling
  - Settings form has stone styling
  - Token page has warm styling (accessible via email link or direct URL)

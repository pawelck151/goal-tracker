# Goal Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal goal tracking app with daily email notifications, token-based task marking, and a PIN-protected dashboard showing goals and 7-day streak.

**Architecture:** Server Actions handle data mutations; `POST /api/goals/[id]/generate-tasks` (maxDuration=60) calls Claude asynchronously after goal creation; two cron Route Handlers secured by `x-cron-secret` header trigger Resend emails; PIN auth via `httpOnly` cookie compared in Edge middleware.

**Tech Stack:** Next.js 16.2.3 (App Router, TypeScript), Prisma v6 (generated to `src/generated/prisma`), Resend v6, `@anthropic-ai/sdk`, Tailwind CSS v4, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Full DB schema |
| `prisma/seed.ts` | Create | Seed single User record |
| `src/lib/prisma.ts` | Create | Prisma singleton |
| `src/lib/auth.ts` | Create | `validatePin`, `setSession`, `clearSession` |
| `src/lib/claude.ts` | Create | `generateTasks`, `parseTasksJson` |
| `src/middleware.ts` | Create | PIN auth guard |
| `src/actions/auth.ts` | Create | `loginAction` Server Action |
| `src/actions/goals.ts` | Create | `createGoal`, `deleteGoal` Server Actions |
| `src/actions/tasks.ts` | Create | `updateTaskStatus` Server Action |
| `src/actions/settings.ts` | Create | `updateSettings` Server Action |
| `src/app/api/goals/[id]/generate-tasks/route.ts` | Create | Async Claude task generation |
| `src/app/api/cron/morning/route.ts` | Create | Morning email trigger |
| `src/app/api/cron/evening/route.ts` | Create | Evening email trigger |
| `src/app/layout.tsx` | Modify | Update metadata |
| `src/app/page.tsx` | Modify | Redirect to /dashboard |
| `src/app/login/page.tsx` | Create | PIN login form |
| `src/app/dashboard/page.tsx` | Create | Metrics + goal cards + streak |
| `src/app/goals/new/page.tsx` | Create | New goal form (Client Component) |
| `src/app/token/[token]/page.tsx` | Create | Task marking page |
| `src/app/settings/page.tsx` | Create | User settings form |

---

### Task 1: Dependencies and environment setup

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install missing packages**

```bash
npm install @anthropic-ai/sdk dotenv
npm install -D vitest tsx
```

Expected: packages appear in `node_modules`, `package.json` updated automatically.

- [ ] **Step 2: Add `test` script and `prisma` seed config to `package.json`**

Open `package.json` and add:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Create `.env.example`**

```
DATABASE_URL=postgresql://user:password@localhost:5432/goal_tracker
AUTH_SECRET=your-random-32-char-secret-here
PIN_PASSWORD=your-pin-here
CRON_SECRET=your-cron-secret-here
RESEND_API_KEY=re_xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
USER_EMAIL=your-email@example.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

- [ ] **Step 4: Create your `.env` with real values**

Copy `.env.example` to `.env` and fill in real values.
Generate `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add package.json .env.example vitest.config.ts
git commit -m "chore: add dependencies, test setup, and env template"
```

---

### Task 2: Prisma schema and migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` with the full schema**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  morningTime String       @default("08:00")
  eveningTime String       @default("20:00")
  timezone    String       @default("Europe/Warsaw")
  createdAt   DateTime     @default(now())
  goals       Goal[]
  dailyLogs   DailyLog[]
  dailyTokens DailyToken[]
}

model Goal {
  id             String   @id @default(cuid())
  userId         String
  title          String
  category       String
  description    String
  startDate      DateTime
  deadline       DateTime
  isActive       Boolean  @default(true)
  tasksGenerated Boolean  @default(false)
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id])
  tasks          Task[]
}

model Task {
  id            String     @id @default(cuid())
  goalId        String
  title         String
  scheduledDate DateTime
  order         Int
  goal          Goal       @relation(fields: [goalId], references: [id])
  dailyLogs     DailyLog[]
}

model DailyLog {
  id     String         @id @default(cuid())
  taskId String
  userId String
  date   DateTime
  status DailyLogStatus @default(PENDING)
  task   Task           @relation(fields: [taskId], references: [id])
  user   User           @relation(fields: [userId], references: [id])

  @@unique([taskId, date])
}

enum DailyLogStatus {
  DONE
  SKIPPED
  PENDING
}

model DailyToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique @default(uuid())
  date      DateTime
  expiresAt DateTime
  usedAt    DateTime?
  user      User      @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 2: Generate the Prisma client**

```bash
npx prisma generate
```

Expected output includes: `✔ Generated Prisma Client to ./src/generated/prisma`

- [ ] **Step 3: Create and apply the migration**

```bash
npx prisma migrate dev --name init
```

Expected: creates `prisma/migrations/` and applies tables to the database.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: Prisma schema with User, Goal, Task, DailyLog, DailyToken"
```

---

### Task 3: Prisma singleton and seed

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create `src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create `prisma/seed.ts`**

```ts
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.USER_EMAIL
  if (!email) throw new Error('USER_EMAIL not set in .env')

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      morningTime: '08:00',
      eveningTime: '20:00',
      timezone: 'Europe/Warsaw',
    },
  })

  console.log(`Seeded user: ${user.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 3: Run the seed**

```bash
npx prisma db seed
```

Expected: `Seeded user: your-email@example.com`

- [ ] **Step 4: Commit**

```bash
git add src/lib/prisma.ts prisma/seed.ts package.json
git commit -m "feat: Prisma singleton and user seed"
```

---

### Task 4: Auth library and tests

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

import { validatePin } from './auth'

describe('validatePin', () => {
  beforeEach(() => {
    process.env.PIN_PASSWORD = 'test-pin-123'
  })

  it('returns true for the correct PIN', () => {
    expect(validatePin('test-pin-123')).toBe(true)
  })

  it('returns false for a wrong PIN', () => {
    expect(validatePin('wrong')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(validatePin('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './auth'`

- [ ] **Step 3: Create `src/lib/auth.ts`**

```ts
import { cookies } from 'next/headers'

export function validatePin(pin: string): boolean {
  return Boolean(pin) && pin === process.env.PIN_PASSWORD
}

export async function setSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session', process.env.AUTH_SECRET!, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: auth library with PIN validation and session cookie"
```

---

### Task 5: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/token/') ||
    pathname.startsWith('/api/cron/')
  ) {
    return NextResponse.next()
  }

  const session = request.cookies.get('session')?.value
  if (session !== process.env.AUTH_SECRET) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: PIN auth middleware"
```

---

### Task 6: Claude wrapper and tests

**Files:**
- Create: `src/lib/claude.ts`
- Create: `src/lib/claude.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/claude.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseTasksJson } from './claude'

describe('parseTasksJson', () => {
  it('parses a clean JSON array', () => {
    const input = '[{"date":"2024-01-01","title":"Task 1","order":1}]'
    const result = parseTasksJson(input)
    expect(result).toEqual([{ date: '2024-01-01', title: 'Task 1', order: 1 }])
  })

  it('extracts JSON array embedded in surrounding text', () => {
    const input = 'Here are your tasks:\n[{"date":"2024-01-01","title":"Task 1","order":1}]\nEnjoy!'
    const result = parseTasksJson(input)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Task 1')
  })

  it('throws when no JSON array is found', () => {
    expect(() => parseTasksJson('No array here')).toThrow('No JSON array found')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './claude'`

- [ ] **Step 3: Create `src/lib/claude.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface TaskItem {
  date: string
  title: string
  order: number
}

export async function generateTasks(
  title: string,
  category: string,
  description: string,
  startDate: Date,
  deadline: Date
): Promise<TaskItem[]> {
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const prompt = `Goal: ${title}
Category: ${category}
Description: ${description}
Start date: ${fmt(startDate)}
Deadline: ${fmt(deadline)}

Break this goal into daily micro-tasks (one task per day, max 30 minutes each).
Return a JSON array only — no markdown, no explanation:
[{ "date": "YYYY-MM-DD", "title": "...", "order": 1 }, ...]
Only include dates between ${fmt(startDate)} and ${fmt(deadline)} inclusive.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response type')

  return parseTasksJson(block.text)
}

export function parseTasksJson(text: string): TaskItem[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in Claude response')
  return JSON.parse(match[0]) as TaskItem[]
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: PASS (6 tests total across `auth.test.ts` and `claude.test.ts`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/claude.ts src/lib/claude.test.ts
git commit -m "feat: Claude wrapper with task generation and JSON parsing"
```

---

### Task 7: Server Actions — auth and goals

**Files:**
- Create: `src/actions/auth.ts`
- Create: `src/actions/goals.ts`

- [ ] **Step 1: Create `src/actions/auth.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { validatePin, setSession, clearSession } from '@/lib/auth'

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const pin = formData.get('pin') as string
  if (!validatePin(pin)) {
    return { error: 'Nieprawidłowy PIN' }
  }
  await setSession()
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}
```

- [ ] **Step 2: Create `src/actions/goals.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

async function getUser() {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error('No user found. Run: npx prisma db seed')
  return user
}

export async function createGoal(
  _prev: { goalId: string } | null,
  formData: FormData
): Promise<{ goalId: string }> {
  const user = await getUser()

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      startDate: new Date(formData.get('startDate') as string),
      deadline: new Date(formData.get('deadline') as string),
    },
  })

  revalidatePath('/dashboard')
  return { goalId: goal.id }
}

export async function deleteGoal(goalId: string): Promise<void> {
  await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: false },
  })
  revalidatePath('/dashboard')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth.ts src/actions/goals.ts
git commit -m "feat: auth and goal Server Actions"
```

---

### Task 8: Server Actions — tasks and settings

**Files:**
- Create: `src/actions/tasks.ts`
- Create: `src/actions/settings.ts`

- [ ] **Step 1: Create `src/actions/tasks.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { DailyLogStatus } from '@/generated/prisma'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export async function updateTaskStatus(
  taskId: string,
  status: DailyLogStatus,
  userId: string
): Promise<void> {
  const today = startOfDay(new Date())

  await prisma.dailyLog.upsert({
    where: { taskId_date: { taskId, date: today } },
    update: { status },
    create: { taskId, userId, date: today, status },
  })

  revalidatePath('/dashboard')
}
```

- [ ] **Step 2: Create `src/actions/settings.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateSettings(formData: FormData): Promise<void> {
  const user = await prisma.user.findFirst()
  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: formData.get('email') as string,
      morningTime: formData.get('morningTime') as string,
      eveningTime: formData.get('eveningTime') as string,
      timezone: formData.get('timezone') as string,
    },
  })

  revalidatePath('/settings')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/actions/tasks.ts src/actions/settings.ts
git commit -m "feat: task status and settings Server Actions"
```

---

### Task 9: Generate tasks endpoint

**Files:**
- Create: `src/app/api/goals/[id]/generate-tasks/route.ts`

- [ ] **Step 1: Create `src/app/api/goals/[id]/generate-tasks/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTasks } from '@/lib/claude'

export const maxDuration = 60

export async function POST(
  _req: Request,
  ctx: RouteContext<'/api/goals/[id]/generate-tasks'>
) {
  const { id } = await ctx.params

  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  if (goal.tasksGenerated) {
    return NextResponse.json({ message: 'Tasks already generated' })
  }

  const items = await generateTasks(
    goal.title,
    goal.category,
    goal.description,
    goal.startDate,
    goal.deadline
  )

  await prisma.$transaction([
    prisma.task.createMany({
      data: items.map((item) => ({
        goalId: goal.id,
        title: item.title,
        scheduledDate: new Date(item.date),
        order: item.order,
      })),
    }),
    prisma.goal.update({
      where: { id: goal.id },
      data: { tasksGenerated: true },
    }),
  ])

  return NextResponse.json({ count: items.length })
}
```

> **Note:** `RouteContext` is globally available in Next.js 16 — no import needed. Types are generated by `next dev` or `next typegen`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/goals/
git commit -m "feat: generate-tasks Route Handler with Claude and maxDuration=60"
```

---

### Task 10: Cron endpoints

**Files:**
- Create: `src/app/api/cron/morning/route.ts`
- Create: `src/app/api/cron/evening/route.ts`

- [ ] **Step 1: Create `src/app/api/cron/morning/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findFirst()
  if (!user) return NextResponse.json({ error: 'No user' }, { status: 500 })

  const today = new Date()
  const tasks = await prisma.task.findMany({
    where: {
      scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
      goal: { userId: user.id, isActive: true },
    },
    include: { goal: true },
    orderBy: { order: 'asc' },
  })

  if (tasks.length === 0) {
    return NextResponse.json({ message: 'No tasks today, skipping email' })
  }

  const token = await prisma.dailyToken.create({
    data: {
      userId: user.id,
      date: today,
      expiresAt: endOfDay(today),
    },
  })

  const tokenUrl = `${process.env.NEXT_PUBLIC_APP_URL}/token/${token.token}`
  const taskList = tasks
    .map((t) => `<li><strong>${t.goal.title}:</strong> ${t.title}</li>`)
    .join('')

  await resend.emails.send({
    from: 'Goal Tracker <onboarding@resend.dev>',
    to: user.email,
    subject: `Twoje zadania na ${today.toLocaleDateString('pl-PL')}`,
    html: `
      <h2>Dzień dobry! Oto Twoje zadania na dziś:</h2>
      <ul>${taskList}</ul>
      <p>
        <a href="${tokenUrl}"
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
          Oznacz zadania
        </a>
      </p>
    `,
  })

  return NextResponse.json({ sent: true, taskCount: tasks.length })
}
```

- [ ] **Step 2: Create `src/app/api/cron/evening/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export async function POST(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findFirst()
  if (!user) return NextResponse.json({ error: 'No user' }, { status: 500 })

  const today = new Date()
  const tasks = await prisma.task.findMany({
    where: {
      scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
      goal: { userId: user.id, isActive: true },
    },
    include: {
      dailyLogs: { where: { date: { gte: startOfDay(today) } } },
      goal: true,
    },
  })

  if (tasks.length === 0) {
    return NextResponse.json({ message: 'No tasks today, skipping email' })
  }

  const done = tasks.filter((t) => t.dailyLogs[0]?.status === 'DONE').length
  const skipped = tasks.filter((t) => t.dailyLogs[0]?.status === 'SKIPPED').length
  const pending = tasks.filter(
    (t) => !t.dailyLogs[0] || t.dailyLogs[0].status === 'PENDING'
  ).length

  const existingToken = await prisma.dailyToken.findFirst({
    where: { userId: user.id, date: { gte: startOfDay(today) } },
  })

  const tokenUrl = existingToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/token/${existingToken.token}`
    : null

  const subject =
    pending > 0
      ? `Czy wykonałeś zadania? (${pending} oczekujących)`
      : `Podsumowanie dnia — ${done}/${tasks.length} zadań`

  const html =
    pending > 0 && tokenUrl
      ? `
        <h2>Wieczorne podsumowanie</h2>
        <p>Masz <strong>${pending}</strong> nieoznaczone zadania na dziś.</p>
        <p>
          <a href="${tokenUrl}"
             style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
            Oznacz zadania
          </a>
        </p>
      `
      : `
        <h2>Świetna robota!</h2>
        <p>Dziś: <strong>${done}</strong> wykonanych, <strong>${skipped}</strong> pominiętych z ${tasks.length} zadań.</p>
      `

  await resend.emails.send({
    from: 'Goal Tracker <onboarding@resend.dev>',
    to: user.email,
    subject,
    html,
  })

  return NextResponse.json({ sent: true, done, skipped, pending })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat: morning and evening cron endpoints with Resend emails"
```

---

### Task 11: Root layout, redirect, and login page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Goal Tracker',
  description: 'Personal goal tracking app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={geist.className}>
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 3: Create `src/app/login/page.tsx`**

The login action must live in a `'use server'` file (imported into the Client Component). It's already in `src/actions/auth.ts` from Task 7.

```tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Goal Tracker</h1>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="pin"
            placeholder="Wprowadź PIN"
            autoFocus
            className="border rounded-lg px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/login/
git commit -m "feat: root layout, redirect to dashboard, login page"
```

---

### Task 12: Dashboard page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create `src/app/dashboard/page.tsx`**

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
          const total = goal._count.tasks
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: dashboard with goal cards, today progress, and streak"
```

---

### Task 13: New goal page

**Files:**
- Create: `src/app/goals/new/page.tsx`

- [ ] **Step 1: Create `src/app/goals/new/page.tsx`**

```tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGoal } from '@/actions/goals'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'work', label: 'Praca' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'learning', label: 'Nauka' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'finance', label: 'Finanse' },
]

export default function NewGoalPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createGoal, null)

  useEffect(() => {
    if (state?.goalId) {
      // Fire and forget — generates tasks in background
      fetch(`/api/goals/${state.goalId}/generate-tasks`, { method: 'POST' })
      router.push('/dashboard')
    }
  }, [state?.goalId, router])

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Nowy cel</h1>
      </div>

      <form action={formAction} className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa celu</label>
          <input
            type="text"
            name="title"
            required
            placeholder="np. Nauczyć się TypeScript"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
          <select
            name="category"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis{' '}
            <span className="text-gray-400 font-normal">
              (dla AI — im więcej szczegółów, tym lepsze zadania)
            </span>
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Opisz cel szczegółowo: co chcesz osiągnąć, jaki masz poziom, jakie masz zasoby..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data startu</label>
            <input
              type="date"
              name="startDate"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              name="deadline"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
        >
          {pending ? 'Tworzenie...' : 'Utwórz cel'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/goals/
git commit -m "feat: new goal form with fire-and-forget task generation"
```

---

### Task 14: Token page

**Files:**
- Create: `src/app/token/[token]/page.tsx`

- [ ] **Step 1: Create `src/app/token/[token]/page.tsx`**

```tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateTaskStatus } from '@/actions/tasks'
import type { DailyLogStatus } from '@/generated/prisma'

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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/token/
git commit -m "feat: token page with task marking via Server Actions"
```

---

### Task 15: Settings page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Create `src/app/settings/page.tsx`**

```tsx
import { prisma } from '@/lib/prisma'
import { updateSettings } from '@/actions/settings'
import Link from 'next/link'

const TIMEZONES = [
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
]

export default async function SettingsPage() {
  const user = await prisma.user.findFirst()
  if (!user) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">Ustawienia</h1>
      </div>

      <form
        action={updateSettings}
        className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email poranny</label>
            <input
              type="time"
              name="morningTime"
              defaultValue={user.morningTime}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email wieczorny</label>
            <input
              type="time"
              name="eveningTime"
              defaultValue={user.eveningTime}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strefa czasowa</label>
          <select
            name="timezone"
            defaultValue={user.timezone}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Zapisz ustawienia
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: settings page"
```

---

## Post-implementation: Deploy to Vercel

- [ ] Push to GitHub: `git push origin main`
- [ ] Create Vercel project and connect to repo
- [ ] Add all env vars in Vercel dashboard (`DATABASE_URL`, `AUTH_SECRET`, `PIN_PASSWORD`, `CRON_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `USER_EMAIL`, `NEXT_PUBLIC_APP_URL`)
- [ ] Run migration on production DB: `npx prisma migrate deploy`
- [ ] Run seed on production DB: `npx prisma db seed`
- [ ] On [cron-job.org](https://cron-job.org), create two jobs:
  - `POST https://your-app.vercel.app/api/cron/morning` — daily at **08:00 UTC**, header `x-cron-secret: <CRON_SECRET>`
  - `POST https://your-app.vercel.app/api/cron/evening` — daily at **20:00 UTC**, header `x-cron-secret: <CRON_SECRET>`
- [ ] Verify Resend from-address: either use `onboarding@resend.dev` (works for testing) or add and verify your own domain at resend.com/domains

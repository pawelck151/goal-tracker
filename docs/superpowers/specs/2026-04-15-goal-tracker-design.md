# Goal Tracker — Design Spec
_Date: 2026-04-15_

## Overview

Personal web app for tracking goals and daily tasks. Sends two emails per day with a link to a token page where the user marks tasks as done or skipped. Dashboard shows active goals, today's tasks, and a 7-day streak.

Single-user application hosted on Vercel (free/hobby tier), PostgreSQL via Prisma, emails via Resend, AI task generation via Claude API.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.3 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma v6 |
| Email | Resend |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| Hosting | Vercel (hobby tier) |
| Styling | Tailwind CSS v4 |
| Cron | cron-job.org (external, free) |

---

## Architecture

### File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         # Redirect → /dashboard
│   ├── login/
│   │   └── page.tsx                     # PIN login form
│   ├── dashboard/
│   │   └── page.tsx                     # Server Component: metrics + goal cards
│   ├── goals/
│   │   └── new/
│   │       └── page.tsx                 # New goal form
│   ├── token/
│   │   └── [token]/
│   │       └── page.tsx                 # Token page (no auth required)
│   ├── settings/
│   │   └── page.tsx                     # User settings
│   └── api/
│       ├── goals/
│       │   └── [id]/
│       │       └── generate-tasks/
│       │           └── route.ts         # POST — Claude task generation
│       └── cron/
│           ├── morning/
│           │   └── route.ts             # POST — morning email (8:00)
│           └── evening/
│               └── route.ts             # POST — evening email (20:00)
├── lib/
│   ├── prisma.ts                        # Prisma singleton
│   ├── auth.ts                          # PIN verification, HMAC cookie session
│   └── claude.ts                        # Claude API wrapper
├── actions/
│   ├── goals.ts                         # createGoal, deleteGoal
│   ├── tasks.ts                         # updateTaskStatus
│   └── settings.ts                      # updateSettings
└── middleware.ts                         # PIN auth guard
```

### Middleware

Protects: `/dashboard`, `/goals/*`, `/settings`  
Public routes: `/login`, `/token/*`, `/api/cron/*`

---

## Database Schema

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  morningTime  String      @default("08:00")
  eveningTime  String      @default("20:00")
  timezone     String      @default("Europe/Warsaw")
  createdAt    DateTime    @default(now())
  goals        Goal[]
  dailyLogs    DailyLog[]
  dailyTokens  DailyToken[]
}

model Goal {
  id              String    @id @default(cuid())
  userId          String
  title           String
  category        String    // work | health | learning | hobby | finance
  description     String
  startDate       DateTime
  deadline        DateTime
  isActive        Boolean   @default(true)
  tasksGenerated  Boolean   @default(false)
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])
  tasks           Task[]
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
  id        String          @id @default(cuid())
  taskId    String
  userId    String
  date      DateTime
  status    DailyLogStatus  @default(PENDING)
  task      Task            @relation(fields: [taskId], references: [id])
  user      User            @relation(fields: [userId], references: [id])

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

---

## Authentication

- Single PIN stored in `.env` as `PIN_PASSWORD`
- On login: Server Action validates PIN, sets `httpOnly` cookie `session` containing HMAC-SHA256 signature over a timestamp, signed with `AUTH_SECRET` from `.env`
- Middleware verifies cookie signature on every protected request; redirects to `/login` on failure
- Session does not expire (personal app)
- Token page (`/token/*`) and cron endpoints (`/api/cron/*`) bypass PIN auth entirely

---

## Email and Cron

### Cron Setup

Two jobs on cron-job.org:
- `POST https://<app>/api/cron/morning` — daily at 08:00 (user's timezone)
- `POST https://<app>/api/cron/evening` — daily at 20:00 (user's timezone)

Both require header: `x-cron-secret: <CRON_SECRET>` (env var). Returns 401 if missing or wrong.

### Morning Email (8:00)

1. Fetch today's tasks (`Task.scheduledDate = today`)
2. If no tasks for today → skip, do not send email
3. Create `DailyToken` (uuid, `expiresAt = midnight`)
4. Send email via Resend with task list and link to `/token/<uuid>`

### Evening Email (20:00)

1. Fetch today's `DailyLog` records
2. If any PENDING → send "Did you complete your tasks?" email with token link
3. If all answered → send daily summary with DONE/SKIPPED counts

### Token Page (`/token/[token]`)

- Server Component — validates token from `DailyToken` (not expired)
- Shows today's task list with "Done" / "Skipped" buttons
- Button click → Server Action → upsert `DailyLog`
- Token remains valid all day (`usedAt` recorded for stats only, does not block re-use)
- Expired or unknown token → error page

---

## Task Generation (Claude API)

### Flow

1. `createGoal` Server Action saves goal (`tasksGenerated: false`), returns `goalId`
2. Client immediately fires `POST /api/goals/[id]/generate-tasks` (no await — fire and forget)
3. Dashboard shows goal with "Generating tasks..." indicator while `tasksGenerated === false`
4. Endpoint calls Claude, bulk-inserts tasks, sets `tasksGenerated: true`
5. User refreshes dashboard → tasks appear

### Endpoint Config

```ts
export const maxDuration = 60 // Vercel hobby: max 60s
```

### Claude Prompt

```
Goal: <title>
Category: <category>
Description: <description>
Start date: <startDate>
Deadline: <deadline>

Break this goal into daily micro-tasks (one task per day, max 30 minutes each).
Return JSON array: [{ "date": "YYYY-MM-DD", "title": "...", "order": 1 }, ...]
Only include dates between startDate and deadline.
```

Model: `claude-sonnet-4-20250514`

---

## Dashboard

Four screens:

1. **Dashboard** — active goal count, today's completion rate, 7-day streak (GitHub-style heatmap for last 7 days), goal cards with progress bar and today's tasks
2. **New Goal** — form: title, category (select), description (textarea for AI), start date, deadline
3. **Token Page** — task list with Done/Skipped buttons, accessible only via email link
4. **Settings** — email address, morning/evening time, timezone

### Streak Calculation

Query `DailyLog` for last 7 days. A day "counts" if at least one task has status `DONE`. Rendered as 7 colored squares.

---

## Environment Variables

```
DATABASE_URL=
AUTH_SECRET=          # Random string for HMAC signing
PIN_PASSWORD=         # Login PIN
CRON_SECRET=          # Shared secret with cron-job.org
RESEND_API_KEY=
ANTHROPIC_API_KEY=
USER_EMAIL=           # Seed: user's email address
```

---

## Seed

`prisma/seed.ts` creates one `User` record using `USER_EMAIL` from `.env`, default times 08:00 / 20:00, timezone `Europe/Warsaw`.

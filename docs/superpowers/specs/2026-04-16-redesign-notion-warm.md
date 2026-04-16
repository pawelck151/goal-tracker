# Goal Tracker — Redesign Spec (Notion Warm)
_Date: 2026-04-16_

## Overview

Comprehensive visual redesign of the Goal Tracker app. Direction: minimalist premium with warm tones, inspired by Notion. Full-width sidebar navigation replaces top header links. Cream/stone palette replaces the current blue/gray.

---

## Color Palette

| Element | Hex | Tailwind class |
|---|---|---|
| Page background | `#F7F5F2` | `bg-stone-100` |
| Card background | `#FDFCFB` | `bg-stone-50` |
| Card border | `#E8E3DC` | `border-stone-200` |
| Primary text | `#1C1917` | `text-stone-900` |
| Secondary text | `#78716C` | `text-stone-500` |
| Muted labels | `#A8A29E` | `text-stone-400` |
| Accent | `#92400E` | `text-amber-800` |
| Accent hover | `#78350F` | `text-amber-900` |
| Progress fill | `#D97706` | `bg-amber-600` |
| Progress track | `#E7E5E4` | `bg-stone-200` |
| Streak active | `#F59E0B` | `bg-amber-500` |
| Streak inactive | `#E7E5E4` | `bg-stone-200` |
| Sidebar active bg | `#FEF3C7` | `bg-amber-50` |
| Sidebar active text | `#92400E` | `text-amber-800` |

---

## Typography

Font: **Geist** (unchanged).

| Element | Classes |
|---|---|
| Page heading | `text-2xl font-semibold tracking-tight text-stone-900` |
| Goal title | `text-lg font-semibold text-stone-900` |
| Section labels | `text-xs font-medium uppercase tracking-wider text-stone-400` |
| Body text | `text-sm text-stone-700` |
| Muted text | `text-sm text-stone-400` |

---

## Layout

### Route groups

```
src/app/
├── (dashboard)/          ← new route group — renders with sidebar
│   ├── layout.tsx         ← wraps children with Sidebar
│   ├── dashboard/
│   │   └── page.tsx
│   ├── goals/
│   │   └── new/
│   │       └── page.tsx
│   └── settings/
│       └── page.tsx
├── login/
│   └── page.tsx           ← no sidebar
├── token/
│   └── [token]/
│       └── page.tsx       ← no sidebar
└── layout.tsx             ← root layout (unchanged)
```

### Sidebar (`src/components/Sidebar.tsx`)

- Server Component
- Fixed left column: `w-56 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col`
- **Top:** App name `Goal Tracker` — `text-sm font-semibold text-stone-900 px-4 py-5`
- **Nav items** (middle, flex-1):
  - Dashboard — icon + label
  - Nowy cel — icon + label
  - Ustawienia — icon + label
  - Active state: `bg-amber-50 text-amber-800 font-medium rounded-lg mx-2`
  - Inactive state: `text-stone-500 hover:bg-stone-100 hover:text-stone-900 rounded-lg mx-2`
  - Each item: `flex items-center gap-3 px-3 py-2 text-sm`
- **Bottom:** Logout form button — `text-stone-400 hover:text-stone-600 text-sm px-4 py-4`

### Main content area

Inside `(dashboard)/layout.tsx`:
```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1 bg-stone-100">
    <div className="max-w-3xl mx-auto px-8 py-8">
      {children}
    </div>
  </main>
</div>
```

Dashboard page heading row (no logout button — moved to sidebar):
```tsx
<div className="flex items-center justify-between mb-8">
  <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
</div>
```

---

## Components

### Goal cards

```
bg-stone-50 border border-stone-200 rounded-2xl p-6
border-l-4 border-amber-500   ← left accent stripe
```

- Category label: `text-xs font-medium uppercase tracking-wider text-stone-400`
- Goal title: `text-lg font-semibold text-stone-900`
- Deadline: `text-sm text-stone-400`
- Progress bar: `h-1.5 rounded-full bg-stone-200` with fill `bg-amber-500`
- Below bar: `text-xs text-stone-400` showing `X% ukończone`

### Task rows (inside goal card)

Each task is a row with a left color indicator:

```
flex items-center gap-3 py-1
```

- Status dot: `w-2 h-2 rounded-full flex-shrink-0`
  - DONE: `bg-green-500`
  - SKIPPED: `bg-stone-300`
  - PENDING: `bg-amber-500`
- DONE task text: `text-sm text-stone-400 line-through`
- SKIPPED task text: `text-sm text-stone-400`
- PENDING task text: `text-sm text-stone-700`

### Streak widget

- 7 circles in a row: `w-6 h-6 rounded-full`
  - Active: `bg-amber-500`
  - Inactive: `bg-stone-200`
- Under each circle: day label `text-xs text-stone-400` (Pn, Wt, Śr, Cz, Pt, Sb, Nd)

### Metric cards (dashboard top row)

```
bg-stone-50 border border-stone-200 rounded-2xl p-5
```

- Number: `text-3xl font-bold text-stone-900`
- Label: `text-xs font-medium uppercase tracking-wider text-stone-400 mt-1`

### Buttons

| Type | Classes |
|---|---|
| Primary CTA | `bg-amber-800 hover:bg-amber-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium` |
| Secondary | `bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-4 py-2 text-sm font-medium` |
| Done (token page) | `bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-1.5 text-sm font-medium` |
| Skipped (token page) | `bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-4 py-1.5 text-sm font-medium` |
| Destructive/logout | `text-stone-400 hover:text-stone-600 text-sm` |

### Form inputs

```
bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900
focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600
```

Label: `text-sm font-medium text-stone-700 mb-1`

Form card wrapper: `bg-stone-50 border border-stone-200 rounded-2xl p-6`

### Login page

Centered card, no sidebar:
```
min-h-screen bg-stone-100 flex items-center justify-center
```
Card: `bg-stone-50 border border-stone-200 rounded-2xl p-8 w-full max-w-sm shadow-sm`

### Token page

No sidebar. Same card/button styles as above.

---

## Files to create / modify

| File | Action |
|---|---|
| `src/components/Sidebar.tsx` | Create — sidebar Server Component |
| `src/app/(dashboard)/layout.tsx` | Create — wraps with Sidebar |
| `src/app/(dashboard)/dashboard/page.tsx` | Move + restyle from `src/app/dashboard/page.tsx` |
| `src/app/(dashboard)/goals/new/page.tsx` | Move + restyle from `src/app/goals/new/page.tsx` |
| `src/app/(dashboard)/settings/page.tsx` | Move + restyle from `src/app/settings/page.tsx` |
| `src/app/dashboard/page.tsx` | Delete (moved) |
| `src/app/goals/new/page.tsx` | Delete (moved) |
| `src/app/settings/page.tsx` | Delete (moved) |
| `src/app/login/page.tsx` | Restyle only |
| `src/app/token/[token]/page.tsx` | Restyle only |
| `src/app/layout.tsx` | Update body background to `bg-stone-100` |

---

## What does NOT change

- All data fetching logic (Prisma queries)
- All Server Actions
- Middleware
- API routes (cron, generate-tasks)
- Database schema
- Authentication logic

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

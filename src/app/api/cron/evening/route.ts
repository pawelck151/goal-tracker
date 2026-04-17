import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  if (req.headers.get('x-cron-secret') === secret) return true
  return false
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany()
  const today = new Date()
  const results: { userId: string; sent: boolean }[] = []

  for (const user of users) {
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
      results.push({ userId: user.id, sent: false })
      continue
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
      pending > 0
        ? `
          <h2>Wieczorne podsumowanie</h2>
          <p>Masz <strong>${pending}</strong> nieoznaczone zadania na dziś.</p>
          ${tokenUrl ? `<p>
            <a href="${tokenUrl}"
               style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
              Oznacz zadania
            </a>
          </p>` : ''}
        `
        : `
          <h2>Świetna robota!</h2>
          <p>Dziś: <strong>${done}</strong> wykonanych, <strong>${skipped}</strong> pominiętych z ${tasks.length} zadań.</p>
        `

    await getResend().emails.send({
      from: 'Goal Tracker <onboarding@resend.dev>',
      to: user.email,
      subject,
      html,
    })

    results.push({ userId: user.id, sent: true })
  }

  return NextResponse.json({ results })
}

export const GET = handle
export const POST = handle


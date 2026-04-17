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
  const results: { userId: string; sent: boolean; taskCount: number }[] = []

  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        goal: { userId: user.id, isActive: true },
      },
      include: { goal: true },
      orderBy: { order: 'asc' },
    })

    if (tasks.length === 0) {
      results.push({ userId: user.id, sent: false, taskCount: 0 })
      continue
    }

    let token = await prisma.dailyToken.findFirst({
      where: { userId: user.id, date: { gte: startOfDay(today), lte: endOfDay(today) } },
    })
    if (!token) {
      token = await prisma.dailyToken.create({
        data: { userId: user.id, date: today, expiresAt: endOfDay(today) },
      })
    }

    const tokenUrl = `${process.env.NEXT_PUBLIC_APP_URL}/token/${token.token}`
    const taskList = tasks
      .map((t) => `<li><strong>${t.goal.title}:</strong> ${t.title}</li>`)
      .join('')

    await getResend().emails.send({
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

    results.push({ userId: user.id, sent: true, taskCount: tasks.length })
  }

  return NextResponse.json({ results })
}

export const GET = handle
export const POST = handle


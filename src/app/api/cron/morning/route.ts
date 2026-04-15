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

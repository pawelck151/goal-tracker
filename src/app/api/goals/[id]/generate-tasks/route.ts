import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTasks } from '@/lib/claude'

export const maxDuration = 60

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

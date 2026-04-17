import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTasks } from '@/lib/claude'

export const maxDuration = 60

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('[generate-tasks] request', { goalId: id })

  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal) {
    console.warn('[generate-tasks] goal not found', { goalId: id })
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  if (goal.tasksGenerated) {
    console.log('[generate-tasks] already generated', { goalId: id })
    return NextResponse.json({ message: 'Tasks already generated' })
  }

  try {
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

    console.log('[generate-tasks] success', { goalId: id, count: items.length })
    return NextResponse.json({ count: items.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-tasks] failed', { goalId: id, error: msg })
    return NextResponse.json(
      { error: 'Task generation failed', detail: msg },
      { status: 500 }
    )
  }
}

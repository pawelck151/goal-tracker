'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { DailyLogStatus } from '@prisma/client'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export async function updateTaskStatus(
  taskId: string,
  status: DailyLogStatus
): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { goal: { select: { userId: true } } },
  })
  if (!task) throw new Error('Task not found')

  const today = startOfDay(new Date())
  const userId = task.goal.userId

  await prisma.dailyLog.upsert({
    where: { taskId_date: { taskId, date: today } },
    update: { status },
    create: { taskId, userId, date: today, status },
  })

  revalidatePath('/dashboard')
  revalidatePath('/token/[token]', 'page')
}

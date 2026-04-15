'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { DailyLogStatus } from '@/generated/prisma/client'

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

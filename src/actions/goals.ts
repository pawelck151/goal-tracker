'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

async function getUser() {
  return requireUser()
}

export type CreateGoalState =
  | { goalId: string }
  | { error: string }
  | null

export async function createGoal(
  _prev: CreateGoalState,
  formData: FormData
): Promise<CreateGoalState> {
  try {
    const user = await getUser()

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        startDate: new Date(formData.get('startDate') as string),
        deadline: new Date(formData.get('deadline') as string),
      },
    })

    revalidatePath('/dashboard')
    return { goalId: goal.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[createGoal] failed', msg)
    return { error: msg }
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: false },
  })
  revalidatePath('/dashboard')
}

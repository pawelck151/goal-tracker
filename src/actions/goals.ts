'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

async function getUser() {
  return requireUser()
}

export type CreateGoalState = { error: string } | null

export async function createGoal(
  _prev: CreateGoalState,
  formData: FormData
): Promise<CreateGoalState> {
  try {
    const user = await getUser()

    await prisma.goal.create({
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[createGoal] failed', msg)
    return { error: msg }
  }
  redirect('/dashboard')
}

export async function deleteGoal(goalId: string): Promise<void> {
  await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: false },
  })
  revalidatePath('/dashboard')
}

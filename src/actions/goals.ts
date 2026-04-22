'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

export type GoalFormState = { error: string } | null

export async function createGoal(
  _prev: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  try {
    const user = await requireUser()

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

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export async function updateGoal(
  goalId: string,
  _prev: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  try {
    const user = await requireUser()

    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    })
    if (!existing) return { error: 'Cel nie istnieje' }

    const today = startOfDay(new Date())
    const existingStart = startOfDay(existing.startDate)
    const submittedStart = new Date(formData.get('startDate') as string)

    const startDate =
      existingStart < today ? existing.startDate : submittedStart

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: formData.get('title') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        startDate,
        deadline: new Date(formData.get('deadline') as string),
      },
    })

    revalidatePath('/dashboard')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[updateGoal] failed', msg)
    return { error: msg }
  }
  redirect('/dashboard')
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  try {
    const user = await requireUser()

    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
      select: { id: true },
    })
    if (!existing) return { error: 'Cel nie istnieje' }

    await prisma.goal.delete({ where: { id: goalId } })
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[deleteGoal] failed', msg)
    return { error: msg }
  }
}

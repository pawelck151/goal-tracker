'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

async function getUser() {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error('No user found. Run: npx prisma db seed')
  return user
}

export async function createGoal(
  _prev: { goalId: string } | null,
  formData: FormData
): Promise<{ goalId: string }> {
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
}

export async function deleteGoal(goalId: string): Promise<void> {
  await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: false },
  })
  revalidatePath('/dashboard')
}

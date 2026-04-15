'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateSettings(formData: FormData): Promise<void> {
  const user = await prisma.user.findFirst()
  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: formData.get('email') as string,
      morningTime: formData.get('morningTime') as string,
      eveningTime: formData.get('eveningTime') as string,
      timezone: formData.get('timezone') as string,
    },
  })

  revalidatePath('/settings')
}

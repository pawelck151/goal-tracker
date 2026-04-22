import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateGoal } from '@/actions/goals'
import { GoalForm } from '@/components/GoalForm'

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
  })
  if (!goal) notFound()

  const boundAction = updateGoal.bind(null, goal.id)

  return (
    <GoalForm
      action={boundAction}
      initial={{
        title: goal.title,
        category: goal.category,
        description: goal.description,
        startDate: goal.startDate,
        deadline: goal.deadline,
      }}
      heading="Edytuj cel"
      submitLabel="Zapisz"
      submitPendingLabel="Zapisywanie..."
      errorTitle="Nie udało się zapisać zmian"
    />
  )
}

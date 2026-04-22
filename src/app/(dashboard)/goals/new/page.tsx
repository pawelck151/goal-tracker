import { createGoal } from '@/actions/goals'
import { GoalForm } from '@/components/GoalForm'

export default function NewGoalPage() {
  return (
    <GoalForm
      action={createGoal}
      heading="Nowy cel"
      submitLabel="Utwórz cel"
      submitPendingLabel="Tworzenie..."
      errorTitle="Nie udało się utworzyć celu"
    />
  )
}

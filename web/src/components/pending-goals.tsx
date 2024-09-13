import { Plus } from 'lucide-react'
import { OutlineButton } from './ui/outline-button'
import { getPendingGoals } from '../http/get-pending-goals'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createGoalCompletion } from '../http/create-goal-completion'

type PedingGoalsResponse = {
  id: string
  title: string
  desiredWeeklyFrequency: number
  completionCount: number
}[]

export function PendingGoals() {

  const queryClient = useQueryClient()

  const { data } = useQuery<PedingGoalsResponse>({
    //identificação unica para esta requisição
    queryKey: ['pending-goals'],
    queryFn: getPendingGoals,
// 60 segundos
  })

  if (!data) {
    return null
  }

  async function handleCompleteGoal(goalId: string) {
    await createGoalCompletion(goalId)
    //faz o fetch dos dados de summary e de pending-goals
    queryClient.invalidateQueries({ queryKey: ['summary']})
    queryClient.invalidateQueries({ queryKey: ['pending-goals']})
  }

  return (
    <div className="flex flex-wrap gap-3">
      {data.map(goal => {
        return (
          <OutlineButton
            key={goal.id}
            disabled={goal.completionCount >= goal.desiredWeeklyFrequency}
            onClick={() => handleCompleteGoal(goal.id)}
          >
            <Plus className="size-4 text-zinc-600" />
            <span className="pr-[6px]">{goal.title}</span>
          </OutlineButton>
        )
      })}
    </div>
  )
}

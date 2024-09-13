import { Dialog } from './components/ui/dialog'
import { CreateGoal } from './components/create-goal'
import { Summary } from './components/summary'
import { EmptyGoals } from './components/empty-goals'
import { useQuery } from '@tanstack/react-query'
import { getSummary } from './http/get-summary'

type SummaryResponse = {
  completed: number
  total: number
  goalsCompletedPerDay: Record<
    string,
    {
      id: string
      title: string
      completedAt: string
    }[]
  >
}

export function App() {
  const { data } = useQuery<SummaryResponse>({
    //identificação unica para esta requisição
    queryKey: ['summary'],
    queryFn: getSummary,
    staleTime: 1000 * 60  // 60 segundos (busca o dado de 60 à 60 segundos)
  })

  return (
    <Dialog>
      {data?.total && data.total > 0 ? <Summary /> : <EmptyGoals />}
      <CreateGoal />
    </Dialog>
  )
}

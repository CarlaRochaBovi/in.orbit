import { CheckCircle2, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { DialogTrigger } from './ui/dialog'
import { InOrbitIcon } from './in-orbit-icon'
import { Progress, ProgressIndicator } from './ui/progress-bar'
import { Separator } from './ui/separator'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSummary } from '../http/get-summary'
import dayjs from 'dayjs'
import ptBR from 'dayjs/locale/pt-BR'
import { PendingGoals } from './pending-goals'
import { deleteGoalCompletionHTTP } from '../http/delete-goal-completion'
import { useEffect, useState } from 'react'

dayjs.locale(ptBR)

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
export function Summary() {
  const queryClient = useQueryClient()


  const [lastDate, setLastDate] = useState<Date>(new Date())
  function checkDayChange() {
    const now = new Date();
    if (lastDate.getDate() !== now.getDate()) {
      console.log('dia mudou')
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['pending-goals'] })

      setLastDate(now)
    }
}

useEffect(() => {
  // Exemplo: Verifica a cada minuto se o dia mudou
const interval = setInterval(checkDayChange, 1000);
return () => clearInterval(interval);
}, [lastDate])

  const { data } = useQuery<SummaryResponse>({
    //identificação unica para esta requisição
    queryKey: ['summary'],
    queryFn: getSummary,
    staleTime: 1000 * 60, // 60 segundos
  })

  if (!data) {
    return null
  }

  async function deleteGoalCompletion(id: string) {
    await deleteGoalCompletionHTTP(id)

    queryClient.invalidateQueries({ queryKey: ['summary'] })
    queryClient.invalidateQueries({ queryKey: ['pending-goals'] })
  }

  const completedPercentage = Math.round((data?.completed * 100) / data.total)

  const firstDayOfWeek = dayjs().startOf('week').format('D MMM')
  const lastDayOfWeek = dayjs().endOf('week').format('D MMM')

  return (
    <div className="py-10 max-w-[480px] px-5 mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InOrbitIcon />
          <span className="text-lg font-semibold capitalize">
            {firstDayOfWeek} - {lastDayOfWeek}
          </span>
        </div>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="size-4" />
            Cadastrar meta
          </Button>
        </DialogTrigger>
      </div>

      <div className="flex flex-col gap-3">
        <Progress value={8} max={15}>
          <ProgressIndicator style={{ width: `${completedPercentage}%` }} />
        </Progress>

        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Você completou{' '}
            <span className="text-zinc-100">{data?.completed}</span> de{' '}
            <span className="text-zinc-100">{data?.total}</span> metas nessa
            semana.
          </span>
          <span>{completedPercentage}%</span>
        </div>
      </div>

      <Separator />

      <PendingGoals />

      {data.goalsCompletedPerDay == null ? (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm">Sem metas concluídas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-medium">Sua semana</h2>

          {
            //Object.entries() == pega as chaves e os valores do objeto
            Object.entries(data.goalsCompletedPerDay).map(([date, goals]) => {
              const weekDay = dayjs(date).format('dddd')

              const formattedDate = dayjs(date).format('D [ de ] MMMM')
              return (
                <div key={date} className="flex flex-col gap-4">
                  <h3 className="font-medium ">
                    <span className="capitalize">{weekDay}</span>
                    <span className="text-zinc-400 text-xs">
                      {' '}
                      ({formattedDate})
                    </span>
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {goals.map(goal => {
                      const time = dayjs(goal.completedAt).format('HH:mm')
                      return (
                        <li key={goal.id} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-pink-500" />
                          <span className="text-sm text-zinc-400">
                            Você completou "
                            <span className="text-zinc-100">{goal.title}</span>"
                            ás <span className="text-zinc-100">{time}h</span>
                            <button
                              type="button"
                              onClick={() => deleteGoalCompletion(goal.id)}
                              className="underline pl-2 hover:cursor-pointer"
                            >
                              Desfazer
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}

import { count, and, lte, gte, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

interface createGoalCompletionRequest {
  goalId: string
}

export async function createGoalCompletion({
  goalId,
}: createGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  // endOf() == função que returna o final de uma semana, mês, ano (neste caso week) etc.
  // toDate() == converte o valor para data
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      //and() == usado quando é necessario ter duas condições
      //gte() == greater then (maior que, sinal: > )
      //lte() == lower then (menor que, sinal: < )
      // (tradução da função where abaixo) onde a data de criação da meta for maior que o primeiro dia da semana e menor que o ultimo dia da semana
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const result = await db
    .with(goalCompletionCounts)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      //sql == usado pra escrever código sql
      //COALESCE == caso um valor seja null, seja um valor default então no caso 0
      completionCount: sql`
      COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goals)
    //este leftJoin basicamente checa se a meta esta completada, se estiver ele retorna os dados das duas tabelas (goals e goalCompletionCounts[que é uma query])
    //!!! se a meta estiver completada ele selecionará as metas cuja os ids da tabela goals forem iguais aos da query goalsCompletionCounts(que é a goalCompletions) (não sei o por que disso) !!!
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desiredWeeklyFrequency } = result[0]

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error('Goal already completed this week!')
  }

  const insertResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning()
  const goalCompletion = insertResult[0]

  return {
    goalCompletion,
  }
}

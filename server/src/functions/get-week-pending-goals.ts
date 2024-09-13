import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { goalCompletions, goals } from '../db/schema'
import { count, gte, lte, and, eq, sql } from 'drizzle-orm'
import { db } from '../db'

dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  // endOf() == função que returna o final de uma semana, mês, ano (neste caso week) etc.
  // toDate() == converte o valor para data
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  //!!! $with == não sei exatamente o que faz (acredito que extrai tabelas com relations) (cria uma common table expression) !!!
  //usa-se $ para CRIAR uma common table expression
  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    //select().from(goals) == seleciona de goals, lte == low than or equal ou >=
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

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
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const pendingGoals = await db
    //não se usa $ neste caso pois agora se esta CRIANDO uma query para usar uma common table expression
    .with(goalsCreatedUpToWeek, goalCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      //sql == usado pra escrever código sql
      //COALESCE == caso um valor seja null, seja um valor default então
      completionCount: sql`
      COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
      //.mapWith() == transforma no tipo de vari´zvel que você quiser

    })
    .from(goalsCreatedUpToWeek)
    //leftJoin() == junta registros de duas tabelas e caso não aja registro retorna-os como null
    //não utilizaremos innerJoin() pois neste caso queremos retornar zero caso nenhuma meta estaja completa, innerJoin só retorna se ouver alguma meta completa
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id)
    )

  return {
    pendingGoals,
  }
}

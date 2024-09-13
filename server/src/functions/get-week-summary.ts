import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'
import { desc } from 'drizzle-orm'

export async function getWeekSummary() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

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

  const goalsCompletedInWeek = db.$with('goals_completed_in_week').as(
    db
      .select({
        id: goalCompletions.id,
        title: goals.title,
        completedAt: goalCompletions.createdAt,
        completedAtDate: sql`
          DATE(${goalCompletions.createdAt})
        `.as('completedAtDate'),
        //DATE() == retira horários e deixa apenas datas
      })
      .from(goalCompletions)
      .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
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
      .orderBy(desc(goalCompletions.createdAt))
  )

  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
    //groupBy() == agrupa todas as colunas de uma tabela que valores iguais ao estipulado
    db
      //todo select retorna um array
      .select({
        completedAtDate: goalsCompletedInWeek.completedAtDate,
        completions: sql`
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ${goalsCompletedInWeek.id},
              'title', ${goalsCompletedInWeek.title},
              'completedAt', ${goalsCompletedInWeek.completedAt},
              'completedAtDate', ${goalsCompletedInWeek.completedAtDate}
            )
          )
        `.as('completions'),
        //JSON_AGG == cria um array
        //JSON_BUILD_OBJECT == cria um objeto
      })
      .from(goalsCompletedInWeek)
      .groupBy(goalsCompletedInWeek.completedAtDate)
      .orderBy(desc(goalsCompletedInWeek.completedAtDate))
  )

  //tipagem da coluna goalsPerDay que não é reconhecida pelo drizzle
  type GoalsCompletedPerDay = Record<
    string,
    {
      id: string
      title: string
      completedAt: string
    }[]
  >

  const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
    .select({
      completed: sql`
        (SELECT COUNT(*) FROM ${goalsCompletedInWeek})
      `.mapWith(Number),
      total: sql`
      (SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})
    `.mapWith(Number),
    goalsCompletedPerDay: sql<GoalsCompletedPerDay>`
      JSON_OBJECT_AGG(
        ${goalsCompletedByWeekDay.completedAtDate},
        ${goalsCompletedByWeekDay.completions}
      )
    `,
    })
    .from(goalsCompletedByWeekDay)

  return {
    summary: result[0],
  }
}

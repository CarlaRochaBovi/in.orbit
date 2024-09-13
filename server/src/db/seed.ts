import { client, db } from '.'
import { goalCompletions, goals } from './schema'
import dayjs from 'dayjs'

async function seed() {
  await db.delete(goalCompletions)
  await db.delete(goals)

  const result = await db.insert(goals).values([
    { title: 'Acordar cedo', desiredWeeklyFrequency: 5 },
    { title: 'Me exercitar', desiredWeeklyFrequency: 4 },
    { title: 'Meditar', desiredWeeklyFrequency: 1 },
    { title: 'Passear com o cachorro', desiredWeeklyFrequency: 3 },
  ]).returning()
  //.returning() == faz com que o insert retorne os dados inseridos

  const startOfWeek = dayjs().startOf('week')
  await db.insert(goalCompletions).values([
    { goalId: result[0].id, createdAt: startOfWeek.toDate() },
    { goalId: result[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
    { goalId: result[2].id, createdAt: startOfWeek.add(1, 'day').toDate() },
    { goalId: result[3].id, createdAt: startOfWeek.add(1, 'day').toDate() },
    { goalId: result[2].id, createdAt: startOfWeek.add(2, 'day').toDate() }
  ])
}

//.then() == executa caso a promise de certo, .finally() == executa independente se a promise der certo ou errado
seed().finally(() => {
  client.end()
})
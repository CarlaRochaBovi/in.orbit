import { eq } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions } from '../db/schema'

interface deleteGoalCompletionRequest {
  id: string
}
export async function deleteGoalCompletion({
  id,
}: deleteGoalCompletionRequest) {

  const result = await db.delete(goalCompletions).where(eq(goalCompletions.id, id))

  return {
    result
  }
}

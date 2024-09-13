import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { createGoalRoute } from '../routes/create-goal'
import { getPendingGoalsRoute } from '../routes/get-pending-goals'
import { createCompletionGoalRoute } from '../routes/create-completion'
import { getWeekSummaryRoute } from '../routes/get-week-summary'
import fastifyCors from '@fastify/cors'
import { deleteGoalCompletionRoute } from '../routes/delete-goal-completion'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
  origin: '*',
})

app.register(createGoalRoute)
app.register(createCompletionGoalRoute)
app.register(getPendingGoalsRoute)
app.register(getWeekSummaryRoute)
app.register(deleteGoalCompletionRoute)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running!')
  })

import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { deleteGoalCompletion } from '../functions/delete-goal-completion';

export const deleteGoalCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/completions/:id',
    {
      schema: {
        params: z.object({
          id: z.string()
        })
      },
    },
    async (request, reply) => {
      const { id } = request.params
      await deleteGoalCompletion({ id })

      reply.status(204).send();
    }
  )
};
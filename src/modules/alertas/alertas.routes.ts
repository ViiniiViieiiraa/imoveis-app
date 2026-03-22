import { FastifyInstance } from 'fastify'
import { getAlertas } from './alertas.service'

export default async function alertasRoutes(fastify: FastifyInstance) {
  fastify.get('/api/alertas', async (_request, reply) => {
    const alertas = await getAlertas()
    return reply.send(alertas)
  })
}
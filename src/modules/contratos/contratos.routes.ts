import { FastifyInstance } from 'fastify'

export default async function contratosRoutes(fastify: FastifyInstance) {
  fastify.get('/contratos', async (_request, reply) => {
    return reply.view('contratos/index', { title: 'Contratos', contratos: [] })
  })
}
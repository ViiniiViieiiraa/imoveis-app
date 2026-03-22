import { FastifyInstance } from 'fastify'

export default async function despesasRoutes(fastify: FastifyInstance) {
  fastify.get('/despesas', async (_request, reply) => {
    return reply.view('despesas/index', { title: 'Despesas', despesas: [] })
  })
}
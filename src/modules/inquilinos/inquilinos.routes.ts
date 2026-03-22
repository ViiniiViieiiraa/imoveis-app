import { FastifyInstance } from 'fastify'

export default async function inquilinosRoutes(fastify: FastifyInstance) {
  fastify.get('/inquilinos', async (_request, reply) => {
    return reply.view('inquilinos/index', { title: 'Inquilinos', inquilinos: [] })
  })
}
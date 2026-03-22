import { FastifyInstance } from 'fastify'

export default async function unidadesRoutes(fastify: FastifyInstance) {
  fastify.get('/unidades', async (_request, reply) => {
    return reply.view('unidades/index', { title: 'Unidades', unidades: [] })
  })
}
import { FastifyInstance } from 'fastify'

export default async function pagamentosRoutes(fastify: FastifyInstance) {
  fastify.get('/pagamentos', async (_request, reply) => {
    return reply.view('pagamentos/index', { title: 'Pagamentos', pagamentos: [] })
  })
}
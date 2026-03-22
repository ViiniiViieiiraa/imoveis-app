import { FastifyInstance } from 'fastify'

export default async function imoveisRoutes(fastify: FastifyInstance) {
  fastify.get('/imoveis', async (_request, reply) => {
    return reply.view('imoveis/index', { title: 'Imóveis', imoveis: [] })
  })
}
import { FastifyInstance } from 'fastify'
import { getDashboardData } from './dashboard.service'

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    return reply.redirect('/dashboard')
  })

  fastify.get('/dashboard', async (_request, reply) => {
    const data = await getDashboardData()
    return reply.view('dashboard', { title: 'Dashboard', ...data })
  })
}
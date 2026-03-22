import fp from 'fastify-plugin'
import staticPlugin from '@fastify/static'
import path from 'path'

export default fp(async (fastify) => {
  await fastify.register(staticPlugin, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/public/',
  })
})
import 'dotenv/config'
import Fastify from 'fastify'
import { config } from './config'
import { prisma } from './database'

import viewsPlugin from './plugins/views'
import staticPlugin from './plugins/static'
import errorHandlerPlugin from './plugins/errorHandler'

import dashboardRoutes from './modules/dashboard/dashboard.routes'
import imoveisRoutes from './modules/imoveis/imoveis.routes'
import unidadesRoutes from './modules/unidades/unidades.routes'
import inquilinosRoutes from './modules/inquilinos/inquilinos.routes'
import contratosRoutes from './modules/contratos/contratos.routes'
import pagamentosRoutes from './modules/pagamentos/pagamentos.routes'
import despesasRoutes from './modules/despesas/despesas.routes'
import alertasRoutes from './modules/alertas/alertas.routes'

const fastify = Fastify({
  logger: {
    level: config.isDev ? 'info' : 'warn',
    transport: config.isDev
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

async function bootstrap() {
  await fastify.register(staticPlugin)
  await fastify.register(viewsPlugin)
  await fastify.register(errorHandlerPlugin)

  await fastify.register(dashboardRoutes)
  await fastify.register(imoveisRoutes)
  await fastify.register(unidadesRoutes)
  await fastify.register(inquilinosRoutes)
  await fastify.register(contratosRoutes)
  await fastify.register(pagamentosRoutes)
  await fastify.register(despesasRoutes)
  await fastify.register(alertasRoutes)

  await fastify.listen({ port: config.port, host: config.host })
  console.log(`\n  Sistema rodando em http://${config.host}:${config.port}\n`)
}

async function shutdown() {
  await prisma.$disconnect()
  await fastify.close()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
import fp from 'fastify-plugin'
import { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../shared/errors'

export default fp(async (fastify) => {
  fastify.setErrorHandler(async (error, _request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).view('error', {
        title: 'Erro',
        message: error.message,
        statusCode: error.statusCode,
      })
    }

    return reply.status(500).view('error', {
      title: 'Erro interno',
      message: 'Algo deu errado. Tente novamente.',
      statusCode: 500,
    })
  })

  fastify.setNotFoundHandler(async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).view('error', {
      title: 'Página não encontrada',
      message: 'A página que você procura não existe.',
      statusCode: 404,
    })
  })
})
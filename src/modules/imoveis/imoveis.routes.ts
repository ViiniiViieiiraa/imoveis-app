import { FastifyInstance } from 'fastify'
import { imovelSchema } from './imoveis.schema'
import { listImoveis, getImovel, createImovel, updateImovel, deleteImovel } from './imoveis.service'
import { ValidationError } from '../../shared/errors'
import { ZodError } from 'zod'

function parseErrors(err: unknown): Record<string, string> | null {
  if (err instanceof ZodError)
    return Object.fromEntries(err.errors.map((e) => [e.path[0], e.message]))
  return null
}

export default async function imoveisRoutes(fastify: FastifyInstance) {
  fastify.get('/imoveis', async (request, reply) => {
    const q = request.query as Record<string, string>
    const imoveis = await listImoveis()
    return reply.view('imoveis/index', {
      title: 'Imóveis', activePage: '/imoveis', imoveis,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/imoveis/novo', async (_req, reply) => {
    return reply.view('imoveis/form', {
      title: 'Novo Imóvel', activePage: '/imoveis', imovel: null, errors: null,
    })
  })

  fastify.post('/imoveis', async (request, reply) => {
    try {
      const data = imovelSchema.parse(request.body)
      const imovel = await createImovel(data)
      return reply.redirect(`/imoveis/${imovel.id}?flash=success&msg=Im%C3%B3vel+criado+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) return reply.view('imoveis/form', { title: 'Novo Imóvel', activePage: '/imoveis', imovel: request.body, errors })
      throw err
    }
  })

  fastify.get('/imoveis/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const imovel = await getImovel(Number(id))
    return reply.view('imoveis/show', {
      title: imovel.nome, activePage: '/imoveis', imovel,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/imoveis/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const imovel = await getImovel(Number(id))
    return reply.view('imoveis/form', {
      title: 'Editar Imóvel', activePage: '/imoveis', imovel, errors: null,
    })
  })

  fastify.post('/imoveis/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    try {
      const data = imovelSchema.parse(request.body)
      await updateImovel(numId, data)
      return reply.redirect(`/imoveis/${numId}?flash=success&msg=Im%C3%B3vel+atualizado+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        return reply.view('imoveis/form', { title: 'Editar Imóvel', activePage: '/imoveis', imovel: { ...request.body as object, id: numId }, errors })
      }
      throw err
    }
  })

  fastify.post('/imoveis/:id/excluir', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteImovel(Number(id))
      return reply.redirect('/imoveis?flash=success&msg=Im%C3%B3vel+exclu%C3%ADdo')
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/imoveis/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })
}

import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { inquilinoSchema } from './inquilinos.schema'
import { listInquilinos, getInquilino, createInquilino, updateInquilino, deleteInquilino } from './inquilinos.service'
import { ValidationError } from '../../shared/errors'

function parseErrors(err: unknown): Record<string, string> | null {
  if (err instanceof ZodError)
    return Object.fromEntries(err.errors.map((e) => [e.path[0], e.message]))
  return null
}

export default async function inquilinosRoutes(fastify: FastifyInstance) {
  fastify.get('/inquilinos', async (request, reply) => {
    const q = request.query as Record<string, string>
    const inquilinos = await listInquilinos(q.busca || undefined)
    return reply.view('inquilinos/index', {
      title: 'Inquilinos', activePage: '/inquilinos', inquilinos,
      busca: q.busca || '', flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/inquilinos/novo', async (_req, reply) => {
    return reply.view('inquilinos/form', {
      title: 'Novo Inquilino', activePage: '/inquilinos', inquilino: null, errors: null,
    })
  })

  fastify.post('/inquilinos', async (request, reply) => {
    try {
      const data = inquilinoSchema.parse(request.body)
      const inquilino = await createInquilino(data)
      return reply.redirect(`/inquilinos/${inquilino.id}?flash=success&msg=Inquilino+criado+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) return reply.view('inquilinos/form', { title: 'Novo Inquilino', activePage: '/inquilinos', inquilino: request.body, errors })
      throw err
    }
  })

  fastify.get('/inquilinos/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const inquilino = await getInquilino(Number(id))
    return reply.view('inquilinos/show', {
      title: inquilino.nome, activePage: '/inquilinos', inquilino,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/inquilinos/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const inquilino = await getInquilino(Number(id))
    return reply.view('inquilinos/form', {
      title: 'Editar Inquilino', activePage: '/inquilinos', inquilino, errors: null,
    })
  })

  fastify.post('/inquilinos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    try {
      const data = inquilinoSchema.parse(request.body)
      await updateInquilino(numId, data)
      return reply.redirect(`/inquilinos/${numId}?flash=success&msg=Inquilino+atualizado+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors)
        return reply.view('inquilinos/form', { title: 'Editar Inquilino', activePage: '/inquilinos', inquilino: { ...request.body as object, id: numId }, errors })
      throw err
    }
  })

  fastify.post('/inquilinos/:id/excluir', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteInquilino(Number(id))
      return reply.redirect('/inquilinos?flash=success&msg=Inquilino+exclu%C3%ADdo')
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/inquilinos/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })
}

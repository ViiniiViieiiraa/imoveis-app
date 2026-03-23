import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { unidadeSchema } from './unidades.schema'
import { listUnidades, getUnidade, createUnidade, updateUnidade, deleteUnidade, listImoveisParaSelect } from './unidades.service'
import { ValidationError } from '../../shared/errors'

function parseErrors(err: unknown): Record<string, string> | null {
  if (err instanceof ZodError)
    return Object.fromEntries(err.errors.map((e) => [e.path[0], e.message]))
  return null
}

export default async function unidadesRoutes(fastify: FastifyInstance) {
  fastify.get('/unidades', async (request, reply) => {
    const q = request.query as Record<string, string>
    const unidades = await listUnidades({
      status: q.status || undefined,
      imovel_id: q.imovel_id ? Number(q.imovel_id) : undefined,
    })
    const imoveis = await listImoveisParaSelect()
    return reply.view('unidades/index', {
      title: 'Unidades', activePage: '/unidades', unidades, imoveis,
      filtroStatus: q.status || '', filtroImovel: q.imovel_id || '',
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/unidades/nova', async (request, reply) => {
    const q = request.query as Record<string, string>
    const imoveis = await listImoveisParaSelect()
    return reply.view('unidades/form', {
      title: 'Nova Unidade', activePage: '/unidades',
      unidade: { imovel_id: q.imovel_id || '' }, imoveis, errors: null,
    })
  })

  fastify.post('/unidades', async (request, reply) => {
    try {
      const data = unidadeSchema.parse(request.body)
      const unidade = await createUnidade(data)
      return reply.redirect(`/unidades/${unidade.id}?flash=success&msg=Unidade+criada+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        const imoveis = await listImoveisParaSelect()
        return reply.view('unidades/form', { title: 'Nova Unidade', activePage: '/unidades', unidade: request.body, imoveis, errors })
      }
      throw err
    }
  })

  fastify.get('/unidades/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const unidade = await getUnidade(Number(id))
    const contratoAtivo = unidade.contratos.find((c) => c.status === 'ativo') || null
    return reply.view('unidades/show', {
      title: unidade.identificacao, activePage: '/unidades', unidade, contratoAtivo,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/unidades/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const unidade = await getUnidade(Number(id))
    const imoveis = await listImoveisParaSelect()
    return reply.view('unidades/form', {
      title: 'Editar Unidade', activePage: '/unidades', unidade, imoveis, errors: null,
    })
  })

  fastify.post('/unidades/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    try {
      const data = unidadeSchema.parse(request.body)
      await updateUnidade(numId, data)
      return reply.redirect(`/unidades/${numId}?flash=success&msg=Unidade+atualizada+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        const imoveis = await listImoveisParaSelect()
        return reply.view('unidades/form', { title: 'Editar Unidade', activePage: '/unidades', unidade: { ...request.body as object, id: numId }, imoveis, errors })
      }
      throw err
    }
  })

  fastify.post('/unidades/:id/excluir', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteUnidade(Number(id))
      return reply.redirect('/unidades?flash=success&msg=Unidade+exclu%C3%ADda')
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/unidades/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })
}

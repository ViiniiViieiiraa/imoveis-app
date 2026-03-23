import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { contratoSchema, reajusteSchema } from './contratos.schema'
import {
  listContratos, getContrato, createContrato, updateContrato,
  encerrarContrato, aplicarReajuste, deleteContrato,
  listUnidadesVagasParaSelect, listInquilinosParaSelect,
} from './contratos.service'
import { ValidationError } from '../../shared/errors'

function parseErrors(err: unknown): Record<string, string> | null {
  if (err instanceof ZodError)
    return Object.fromEntries(err.errors.map((e) => [e.path[0], e.message]))
  return null
}

export default async function contratosRoutes(fastify: FastifyInstance) {
  fastify.get('/contratos', async (request, reply) => {
    const q = request.query as Record<string, string>
    const contratos = await listContratos(q.status || undefined)
    return reply.view('contratos/index', {
      title: 'Contratos', activePage: '/contratos', contratos,
      filtroStatus: q.status || '', flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/contratos/novo', async (request, reply) => {
    const q = request.query as Record<string, string>
    const unidades = await listUnidadesVagasParaSelect()
    const inquilinos = await listInquilinosParaSelect()
    return reply.view('contratos/form', {
      title: 'Novo Contrato', activePage: '/contratos',
      contrato: { unidade_id: q.unidade_id || '', inquilino_id: q.inquilino_id || '' },
      unidades, inquilinos, errors: null,
    })
  })

  fastify.post('/contratos', async (request, reply) => {
    try {
      const data = contratoSchema.parse(request.body)
      const contrato = await createContrato(data)
      return reply.redirect(`/contratos/${contrato.id}?flash=success&msg=Contrato+criado+com+sucesso`)
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/contratos/novo?flash=error&msg=${encodeURIComponent(err.message)}`)
      const errors = parseErrors(err)
      if (errors) {
        const unidades = await listUnidadesVagasParaSelect()
        const inquilinos = await listInquilinosParaSelect()
        return reply.view('contratos/form', { title: 'Novo Contrato', activePage: '/contratos', contrato: request.body, unidades, inquilinos, errors })
      }
      throw err
    }
  })

  fastify.get('/contratos/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const contrato = await getContrato(Number(id))
    const hoje = new Date()
    const reajusteVencido = contrato.status === 'ativo' && new Date(contrato.proximo_reajuste) < hoje
    const reajusteProximo = contrato.status === 'ativo' && !reajusteVencido &&
      new Date(contrato.proximo_reajuste) <= new Date(hoje.getTime() + 30 * 86400000)
    return reply.view('contratos/show', {
      title: `Contrato #${contrato.id}`, activePage: '/contratos', contrato,
      reajusteVencido, reajusteProximo, flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/contratos/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    const contrato = await getContrato(numId)
    const unidades = await listUnidadesVagasParaSelect(numId)
    const inquilinos = await listInquilinosParaSelect()
    return reply.view('contratos/form', {
      title: 'Editar Contrato', activePage: '/contratos', contrato, unidades, inquilinos, errors: null,
    })
  })

  fastify.post('/contratos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    try {
      const data = contratoSchema.parse(request.body)
      await updateContrato(numId, data)
      return reply.redirect(`/contratos/${numId}?flash=success&msg=Contrato+atualizado+com+sucesso`)
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        const unidades = await listUnidadesVagasParaSelect(numId)
        const inquilinos = await listInquilinosParaSelect()
        return reply.view('contratos/form', { title: 'Editar Contrato', activePage: '/contratos', contrato: { ...request.body as object, id: numId }, unidades, inquilinos, errors })
      }
      throw err
    }
  })

  fastify.post('/contratos/:id/encerrar', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await encerrarContrato(Number(id))
      return reply.redirect(`/contratos/${id}?flash=success&msg=Contrato+encerrado+com+sucesso`)
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/contratos/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })

  fastify.post('/contratos/:id/reajuste', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = reajusteSchema.parse(request.body)
      await aplicarReajuste(Number(id), data)
      return reply.redirect(`/contratos/${id}?flash=success&msg=Reajuste+aplicado+com+sucesso`)
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ZodError)
        return reply.redirect(`/contratos/${id}?flash=error&msg=${encodeURIComponent((err as Error).message)}`)
      throw err
    }
  })

  fastify.post('/contratos/:id/excluir', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteContrato(Number(id))
      return reply.redirect('/contratos?flash=success&msg=Contrato+exclu%C3%ADdo')
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/contratos/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })
}

import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { despesaSchema, CATEGORIAS, CATEGORIAS_LABELS } from './despesas.schema'
import { listDespesas, getDespesa, createDespesa, updateDespesa, deleteDespesa, listImoveisParaSelect, listUnidadesParaSelect } from './despesas.service'

function parseErrors(err: unknown): Record<string, string> | null {
  if (err instanceof ZodError)
    return Object.fromEntries(err.errors.map((e) => [e.path[0], e.message]))
  return null
}

const categoriasOptions = CATEGORIAS.map((c) => ({ value: c, label: CATEGORIAS_LABELS[c] ?? c }))

export default async function despesasRoutes(fastify: FastifyInstance) {
  fastify.get('/despesas', async (request, reply) => {
    const hoje = new Date()
    const q = request.query as Record<string, string>
    const despesas = await listDespesas({
      imovel_id: q.imovel_id ? Number(q.imovel_id) : undefined,
      unidade_id: q.unidade_id ? Number(q.unidade_id) : undefined,
      categoria: q.categoria || undefined,
      mes: q.mes ? Number(q.mes) : undefined,
      ano: q.ano ? Number(q.ano) : hoje.getFullYear(),
    })
    const imoveis = await listImoveisParaSelect()
    const total = despesas.reduce((acc: number, d) => acc + Number(d.valor), 0)

    return reply.view('despesas/index', {
      title: 'Despesas', activePage: '/despesas', despesas, imoveis,
      categoriasOptions, total,
      filtroImovel: q.imovel_id || '', filtroCategoria: q.categoria || '',
      filtroMes: q.mes || '', filtroAno: q.ano || String(hoje.getFullYear()),
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.get('/despesas/nova', async (request, reply) => {
    const q = request.query as Record<string, string>
    const imoveis = await listImoveisParaSelect()
    const unidades = await listUnidadesParaSelect()
    return reply.view('despesas/form', {
      title: 'Nova Despesa', activePage: '/despesas',
      despesa: { imovel_id: q.imovel_id || '', unidade_id: q.unidade_id || '' },
      imoveis, unidades, categoriasOptions, errors: null,
    })
  })

  fastify.post('/despesas', async (request, reply) => {
    try {
      const data = despesaSchema.parse(request.body)
      await createDespesa(data)
      return reply.redirect('/despesas?flash=success&msg=Despesa+registrada+com+sucesso')
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        const imoveis = await listImoveisParaSelect()
        const unidades = await listUnidadesParaSelect()
        return reply.view('despesas/form', { title: 'Nova Despesa', activePage: '/despesas', despesa: request.body, imoveis, unidades, categoriasOptions, errors })
      }
      throw err
    }
  })

  fastify.get('/despesas/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const despesa = await getDespesa(Number(id))
    const imoveis = await listImoveisParaSelect()
    const unidades = await listUnidadesParaSelect()
    return reply.view('despesas/form', {
      title: 'Editar Despesa', activePage: '/despesas', despesa, imoveis, unidades, categoriasOptions, errors: null,
    })
  })

  fastify.post('/despesas/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numId = Number(id)
    try {
      const data = despesaSchema.parse(request.body)
      await updateDespesa(numId, data)
      return reply.redirect('/despesas?flash=success&msg=Despesa+atualizada+com+sucesso')
    } catch (err) {
      const errors = parseErrors(err)
      if (errors) {
        const imoveis = await listImoveisParaSelect()
        const unidades = await listUnidadesParaSelect()
        return reply.view('despesas/form', { title: 'Editar Despesa', activePage: '/despesas', despesa: { ...request.body as object, id: numId }, imoveis, unidades, categoriasOptions, errors })
      }
      throw err
    }
  })

  fastify.post('/despesas/:id/excluir', async (request, reply) => {
    const { id } = request.params as { id: string }
    await deleteDespesa(Number(id))
    return reply.redirect('/despesas?flash=success&msg=Despesa+exclu%C3%ADda')
  })
}

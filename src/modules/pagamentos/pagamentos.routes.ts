import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { registrarPagamentoSchema, gerarCobrancasSchema, editarPagamentoSchema } from './pagamentos.schema'
import { listPagamentos, getPagamento, gerarCobrancasMes, registrarPagamento, editarPagamento, atualizarStatusAtrasados } from './pagamentos.service'
import { ValidationError } from '../../shared/errors'

export default async function pagamentosRoutes(fastify: FastifyInstance) {
  fastify.get('/pagamentos', async (request, reply) => {
    const hoje = new Date()
    const q = request.query as Record<string, string>
    const mes = q.mes ? Number(q.mes) : hoje.getMonth() + 1
    const ano = q.ano ? Number(q.ano) : hoje.getFullYear()

    await atualizarStatusAtrasados()

    const pagamentos = await listPagamentos({
      mes, ano,
      status: q.status || undefined,
      contrato_id: q.contrato_id ? Number(q.contrato_id) : undefined,
    })

    const totalPrevisto = pagamentos.reduce((acc: number, p) => acc + Number(p.valor_previsto), 0)
    const totalPago = pagamentos.filter((p) => p.status === 'pago').reduce((acc: number, p) => acc + Number(p.valor_pago ?? 0), 0)
    const totalPendente = pagamentos.filter((p) => p.status === 'pendente' || p.status === 'atrasado').length

    return reply.view('pagamentos/index', {
      title: 'Pagamentos', activePage: '/pagamentos', pagamentos,
      mes, ano, filtroStatus: q.status || '', totalPrevisto, totalPago, totalPendente,
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.post('/pagamentos/gerar', async (request, reply) => {
    try {
      const data = gerarCobrancasSchema.parse(request.body)
      const resultado = await gerarCobrancasMes(data)
      const msg = `${resultado.criados} cobrança(s) gerada(s). ${resultado.ignorados} já existiam.`
      return reply.redirect(`/pagamentos?mes=${data.mes}&ano=${data.ano}&flash=success&msg=${encodeURIComponent(msg)}`)
    } catch (err) {
      if (err instanceof ZodError)
        return reply.redirect(`/pagamentos?flash=error&msg=Dados+inv%C3%A1lidos`)
      throw err
    }
  })

  fastify.get('/pagamentos/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const pagamento = await getPagamento(Number(id))
    return reply.view('pagamentos/show', {
      title: `Pagamento #${pagamento.id}`, activePage: '/pagamentos', pagamento,
      hoje: new Date(),
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.post('/pagamentos/:id/registrar', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = registrarPagamentoSchema.parse(request.body)
      await registrarPagamento(Number(id), data)
      return reply.redirect(`/pagamentos/${id}?flash=success&msg=Pagamento+registrado+com+sucesso`)
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/pagamentos/${id}?flash=error&msg=${encodeURIComponent(err.message)}`)
      throw err
    }
  })

  fastify.post('/pagamentos/:id/editar', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = editarPagamentoSchema.parse(request.body)
      await editarPagamento(Number(id), data)
      return reply.redirect(`/pagamentos/${id}?flash=success&msg=Pagamento+atualizado`)
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ZodError)
        return reply.redirect(`/pagamentos/${id}?flash=error&msg=${encodeURIComponent((err as Error).message)}`)
      throw err
    }
  })
}

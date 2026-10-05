import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { registrarPagamentoSchema, gerarCobrancasSchema, editarPagamentoSchema } from './pagamentos.schema'
import {
  listPagamentos, getPagamento, gerarCobrancasMes, registrarPagamento,
  editarPagamento, atualizarStatusAtrasados, gerarMensagemCobranca,
  getContratosParaGeracao, getResumoMes,
} from './pagamentos.service'
import { ValidationError } from '../../shared/errors'

export default async function pagamentosRoutes(fastify: FastifyInstance) {

  fastify.get('/pagamentos', async (request, reply) => {
    const hoje = new Date()
    const q = request.query as Record<string, string>
    const mes = q.mes ? Number(q.mes) : hoje.getMonth() + 1
    const ano = q.ano ? Number(q.ano) : hoje.getFullYear()

    await atualizarStatusAtrasados()

    const [pagamentos, resumo, contratos] = await Promise.all([
      listPagamentos({ mes, ano, status: q.status || undefined }),
      getResumoMes(mes, ano),
      getContratosParaGeracao(mes, ano),
    ])

    const contratosNaoGerados = contratos.filter((c) => !c.jaGerado).length
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

    return reply.view('pagamentos/index', {
      title: 'Pagamentos', activePage: '/pagamentos',
      pagamentos, resumo, contratos, contratosNaoGerados,
      mes, ano, mesLabel: meses[mes - 1],
      hoje: new Date(),
      filtroStatus: q.status || '',
      flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.post('/pagamentos/gerar', async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>
      const data = gerarCobrancasSchema.parse(body)
      const resultado = await gerarCobrancasMes(data, data.contrato_ids)
      const msg = `${resultado.criados} cobrança(s) gerada(s).${resultado.ignorados > 0 ? ` ${resultado.ignorados} já existiam.` : ''}`
      return reply.redirect(`/pagamentos?mes=${data.mes}&ano=${data.ano}&flash=success&msg=${encodeURIComponent(msg)}`)
    } catch (err) {
      if (err instanceof ValidationError)
        return reply.redirect(`/pagamentos?flash=error&msg=${encodeURIComponent(err.message)}`)
      if (err instanceof ZodError)
        return reply.redirect('/pagamentos?flash=error&msg=Dados+inv%C3%A1lidos')
      throw err
    }
  })

  fastify.get('/pagamentos/:id', async (request, reply) => {
    const q = request.query as Record<string, string>
    const { id } = request.params as { id: string }
    const pagamento = await getPagamento(Number(id))
    const totalDevido = Number(pagamento.valor_previsto) + Number(pagamento.saldo_incorporado)
    const saldoFaltando = totalDevido - Number(pagamento.valor_pago ?? 0)
    return reply.view('pagamentos/show', {
      title: `Pagamento #${pagamento.id}`, activePage: '/pagamentos',
      pagamento, totalDevido, saldoFaltando: Math.max(0, saldoFaltando),
      hoje: new Date(), flash: q.flash, flashMsg: q.msg,
    })
  })

  fastify.post('/pagamentos/:id/registrar', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = registrarPagamentoSchema.parse(request.body)
      await registrarPagamento(Number(id), data)
      const p = await getPagamento(Number(id))
      return reply.redirect(`/pagamentos?mes=${p.mes_referencia}&ano=${p.ano_referencia}&flash=success&msg=Pagamento+registrado`)
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
      const p = await getPagamento(Number(id))
      return reply.redirect(`/pagamentos?mes=${p.mes_referencia}&ano=${p.ano_referencia}&flash=success&msg=Pagamento+atualizado`)
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ZodError)
        return reply.redirect(`/pagamentos/${id}?flash=error&msg=${encodeURIComponent((err as Error).message)}`)
      throw err
    }
  })

  // Endpoint JSON para gerar mensagem de cobrança (chamado via JS no frontend)
  fastify.get('/pagamentos/:id/mensagem', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const mensagem = await gerarMensagemCobranca(Number(id))
      return reply.send({ mensagem })
    } catch (err) {
      return reply.status(400).send({ erro: (err as Error).message })
    }
  })
}

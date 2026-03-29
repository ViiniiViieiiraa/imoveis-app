import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
import { formatCurrency, formatDate } from '../../shared/formatters'
import { getTemplateCobranca } from '../configuracoes/configuracoes.service'
import type { RegistrarPagamentoInput, GerarCobrancasInput, EditarPagamentoInput } from './pagamentos.schema'

export async function listPagamentos(filtros: {
  mes?: number; ano?: number; status?: string; contrato_id?: number
}) {
  return prisma.pagamento.findMany({
    where: {
      ...(filtros.mes ? { mes_referencia: filtros.mes } : {}),
      ...(filtros.ano ? { ano_referencia: filtros.ano } : {}),
      ...(filtros.status ? { status: filtros.status } : {}),
      ...(filtros.contrato_id ? { contrato_id: filtros.contrato_id } : {}),
    },
    orderBy: [{ ano_referencia: 'desc' }, { mes_referencia: 'desc' }, { data_vencimento: 'asc' }],
    include: {
      contrato: {
        include: {
          inquilino: { select: { nome: true, telefone: true } },
          unidade: { select: { identificacao: true, imovel: { select: { nome: true } } } },
        },
      },
    },
  })
}

export async function getPagamento(id: number) {
  const p = await prisma.pagamento.findUnique({
    where: { id },
    include: {
      contrato: {
        include: {
          inquilino: true,
          unidade: { include: { imovel: true } },
        },
      },
    },
  })
  if (!p) throw new NotFoundError('Pagamento')
  return p
}

// Retorna contratos ativos com info se já têm cobrança gerada para o mês/ano
export async function getContratosParaGeracao(mes: number, ano: number) {
  const contratos = await prisma.contrato.findMany({
    where: { status: 'ativo' },
    orderBy: [{ unidade: { imovel: { nome: 'asc' } } }],
    include: {
      inquilino: { select: { nome: true } },
      unidade: { select: { identificacao: true, imovel: { select: { nome: true } } } },
      pagamentos: {
        where: { mes_referencia: mes, ano_referencia: ano },
        take: 1,
      },
    },
  })

  return contratos.map((c) => ({
    ...c,
    jaGerado: c.pagamentos.length > 0,
    saldoDevedor: 0, // calculado abaixo
  }))
}

async function getSaldoDevedor(contratoId: number): Promise<number> {
  // Soma todos os saldos de pagamentos parciais não quitados
  const parciais = await prisma.pagamento.findMany({
    where: { contrato_id: contratoId, status: 'parcial' },
  })
  return parciais.reduce((acc: number, p) => {
    const falta = Number(p.valor_previsto) + Number(p.saldo_incorporado) - Number(p.valor_pago ?? 0)
    return acc + Math.max(0, falta)
  }, 0)
}

export async function gerarCobrancasMes(data: GerarCobrancasInput, contratoIds: number[]) {
  if (contratoIds.length === 0) throw new ValidationError('Selecione ao menos um contrato.')

  const contratos = await prisma.contrato.findMany({
    where: { id: { in: contratoIds }, status: 'ativo' },
  })

  let criados = 0
  let ignorados = 0

  for (const c of contratos) {
    const existe = await prisma.pagamento.findUnique({
      where: {
        contrato_id_mes_referencia_ano_referencia: {
          contrato_id: c.id,
          mes_referencia: data.mes,
          ano_referencia: data.ano,
        },
      },
    })

    if (existe) { ignorados++; continue }

    const saldoAnterior = await getSaldoDevedor(c.id)
    const diaVenc = c.dia_vencimento
    const dataVencimento = new Date(data.ano, data.mes - 1, diaVenc)

    await prisma.pagamento.create({
      data: {
        contrato_id: c.id,
        mes_referencia: data.mes,
        ano_referencia: data.ano,
        valor_previsto: Number(c.valor_aluguel),
        saldo_incorporado: saldoAnterior,
        data_vencimento: dataVencimento,
        status: 'pendente',
        observacoes: saldoAnterior > 0
          ? `Inclui saldo devedor anterior de ${formatCurrency(saldoAnterior)}`
          : undefined,
      },
    })
    criados++
  }

  return { criados, ignorados }
}

export async function registrarPagamento(id: number, data: RegistrarPagamentoInput) {
  const pagamento = await getPagamento(id)

  if (pagamento.status === 'pago') {
    throw new ValidationError('Este pagamento já foi registrado como pago.')
  }

  const totalDevido = Number(pagamento.valor_previsto) + Number(pagamento.saldo_incorporado)
  const valorPago = data.valor_pago
  const isParcial = valorPago < totalDevido - 0.01

  return prisma.pagamento.update({
    where: { id },
    data: {
      valor_pago: valorPago,
      data_pagamento: new Date(data.data_pagamento),
      status: isParcial ? 'parcial' : 'pago',
      observacoes: isParcial
        ? `Pagamento parcial. Faltam ${formatCurrency(totalDevido - valorPago)}.${data.observacoes ? ' ' + data.observacoes : ''}`
        : data.observacoes || pagamento.observacoes,
    },
  })
}

export async function editarPagamento(id: number, data: EditarPagamentoInput) {
  await getPagamento(id)
  return prisma.pagamento.update({
    where: { id },
    data: {
      status: data.status,
      valor_pago: data.valor_pago ?? null,
      data_pagamento: data.data_pagamento ? new Date(data.data_pagamento) : null,
      observacoes: data.observacoes,
    },
  })
}

export async function atualizarStatusAtrasados() {
  const hoje = new Date()
  await prisma.pagamento.updateMany({
    where: { status: 'pendente', data_vencimento: { lt: hoje } },
    data: { status: 'atrasado' },
  })
}

export async function gerarMensagemCobranca(pagamentoId: number): Promise<string> {
  const p = await getPagamento(pagamentoId)
  const template = await getTemplateCobranca()

  const totalDevido = Number(p.valor_previsto) + Number(p.saldo_incorporado)
  const saldoDevedor = totalDevido - Number(p.valor_pago ?? 0)

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesLabel = `${meses[p.mes_referencia - 1]}/${p.ano_referencia}`

  const saldoAnteriorLinha = Number(p.saldo_incorporado) > 0
    ? `⚠️ Inclui saldo devedor anterior: ${formatCurrency(Number(p.saldo_incorporado))}\n`
    : ''

  const valorFinal = p.status === 'parcial'
    ? formatCurrency(saldoDevedor)
    : formatCurrency(totalDevido)

  return template
    .replace(/{nome}/g, p.contrato.inquilino.nome)
    .replace(/{unidade}/g, p.contrato.unidade.identificacao)
    .replace(/{imovel}/g, p.contrato.unidade.imovel.nome)
    .replace(/{valor}/g, valorFinal)
    .replace(/{vencimento}/g, formatDate(p.data_vencimento))
    .replace(/{mes_referencia}/g, mesLabel)
    .replace(/{saldo_anterior}/g, saldoAnteriorLinha)
}

export async function getResumoMes(mes: number, ano: number) {
  const pagamentos = await prisma.pagamento.findMany({
    where: { mes_referencia: mes, ano_referencia: ano },
  })

  const totalPrevisto = pagamentos.reduce((acc: number, p) =>
    acc + Number(p.valor_previsto) + Number(p.saldo_incorporado), 0)
  const totalRecebido = pagamentos
    .filter((p) => p.status === 'pago' || p.status === 'parcial')
    .reduce((acc: number, p) => acc + Number(p.valor_pago ?? 0), 0)
  const qtdPago = pagamentos.filter((p) => p.status === 'pago').length
  const qtdParcial = pagamentos.filter((p) => p.status === 'parcial').length
  const qtdAtrasado = pagamentos.filter((p) => p.status === 'atrasado').length
  const qtdPendente = pagamentos.filter((p) => p.status === 'pendente').length
  const gerado = pagamentos.length > 0

  return { totalPrevisto, totalRecebido, qtdPago, qtdParcial, qtdAtrasado, qtdPendente, gerado, total: pagamentos.length }
}

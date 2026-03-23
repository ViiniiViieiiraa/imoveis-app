import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
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
          inquilino: { select: { nome: true } },
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

export async function gerarCobrancasMes(data: GerarCobrancasInput) {
  const contratos = await prisma.contrato.findMany({
    where: { status: 'ativo' },
  })

  let criados = 0
  let ignorados = 0

  for (const c of contratos) {
    const existe = await prisma.pagamento.findUnique({
      where: { contrato_id_mes_referencia_ano_referencia: {
        contrato_id: c.id,
        mes_referencia: data.mes,
        ano_referencia: data.ano,
      }},
    })

    if (existe) { ignorados++; continue }

    const dia = c.dia_vencimento
    const dataVencimento = new Date(data.ano, data.mes - 1, dia)

    await prisma.pagamento.create({
      data: {
        contrato_id: c.id,
        mes_referencia: data.mes,
        ano_referencia: data.ano,
        valor_previsto: c.valor_aluguel,
        data_vencimento: dataVencimento,
        status: 'pendente',
      },
    })
    criados++
  }

  return { criados, ignorados, total: contratos.length }
}

export async function registrarPagamento(id: number, data: RegistrarPagamentoInput) {
  const pagamento = await getPagamento(id)
  if (pagamento.status === 'pago')
    throw new ValidationError('Este pagamento já foi registrado como pago.')

  return prisma.pagamento.update({
    where: { id },
    data: {
      valor_pago: data.valor_pago,
      data_pagamento: new Date(data.data_pagamento),
      status: 'pago',
      observacoes: data.observacoes,
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
  const result = await prisma.pagamento.updateMany({
    where: { status: 'pendente', data_vencimento: { lt: hoje } },
    data: { status: 'atrasado' },
  })
  return result.count
}

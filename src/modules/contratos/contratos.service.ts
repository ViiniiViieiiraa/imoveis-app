import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
import type { ContratoInput, ReajusteInput } from './contratos.schema'

export async function listContratos(filtroStatus?: string) {
  return prisma.contrato.findMany({
    where: filtroStatus ? { status: filtroStatus } : undefined,
    orderBy: { criado_em: 'desc' },
    include: {
      unidade: { include: { imovel: { select: { nome: true } } } },
      inquilino: { select: { nome: true, telefone: true } },
      _count: { select: { pagamentos: true } },
    },
  })
}

export async function getContrato(id: number) {
  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      unidade: { include: { imovel: true } },
      inquilino: true,
      pagamentos: {
        orderBy: [{ ano_referencia: 'desc' }, { mes_referencia: 'desc' }],
      },
      historico_reajustes: { orderBy: { data_reajuste: 'desc' } },
    },
  })
  if (!contrato) throw new NotFoundError('Contrato')
  return contrato
}

export async function listUnidadesVagasParaSelect(contratoId?: number) {
  // lista unidades vagas + a própria unidade do contrato sendo editado
  return prisma.unidade.findMany({
    where: {
      OR: [
        { status: 'vaga' },
        ...(contratoId ? [{ contratos: { some: { id: contratoId } } }] : []),
      ],
    },
    orderBy: [{ imovel: { nome: 'asc' } }, { identificacao: 'asc' }],
    include: { imovel: { select: { nome: true } } },
  })
}

export async function listInquilinosParaSelect() {
  return prisma.inquilino.findMany({
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  })
}

export async function createContrato(data: ContratoInput) {
  const unidade = await prisma.unidade.findUnique({ where: { id: data.unidade_id } })
  if (!unidade) throw new ValidationError('Unidade não encontrada.')

  const contratoAtivo = await prisma.contrato.findFirst({
    where: { unidade_id: data.unidade_id, status: { in: ['ativo', 'suspenso'] } },
  })
  if (contratoAtivo) throw new ValidationError('Esta unidade já possui um contrato ativo.')

  const dataInicio = new Date(data.data_inicio)
  const proximoReajuste = new Date(dataInicio)
  proximoReajuste.setFullYear(proximoReajuste.getFullYear() + 1)

  const contrato = await prisma.contrato.create({
    data: {
      unidade_id: data.unidade_id,
      inquilino_id: data.inquilino_id,
      data_inicio: dataInicio,
      data_fim: data.data_fim ? new Date(data.data_fim) : null,
      valor_aluguel: data.valor_aluguel,
      dia_vencimento: data.dia_vencimento,
      proximo_reajuste: proximoReajuste,
      observacoes: data.observacoes,
    },
  })

  await prisma.unidade.update({ where: { id: data.unidade_id }, data: { status: 'ocupada', dia_vencimento: data.dia_vencimento } })

  return contrato
}

export async function updateContrato(id: number, data: ContratoInput) {
  await getContrato(id)
  return prisma.contrato.update({
    where: { id },
    data: {
      inquilino_id: data.inquilino_id,
      data_inicio: new Date(data.data_inicio),
      data_fim: data.data_fim ? new Date(data.data_fim) : null,
      valor_aluguel: data.valor_aluguel,
      dia_vencimento: data.dia_vencimento,
      observacoes: data.observacoes,
    },
  })
}

export async function encerrarContrato(id: number) {
  const contrato = await getContrato(id)
  if (contrato.status !== 'ativo' && contrato.status !== 'suspenso')
    throw new ValidationError('Apenas contratos ativos ou suspensos podem ser encerrados.')

  await prisma.contrato.update({
    where: { id },
    data: { status: 'encerrado', data_fim: new Date() },
  })

  await prisma.unidade.update({
    where: { id: contrato.unidade_id },
    data: { status: 'vaga' },
  })
}

export async function aplicarReajuste(id: number, data: ReajusteInput) {
  const contrato = await getContrato(id)
  if (contrato.status !== 'ativo')
    throw new ValidationError('Apenas contratos ativos podem ter reajuste aplicado.')

  const valorAnterior = Number(contrato.valor_aluguel)
  const valorNovo = Number((valorAnterior * (1 + data.percentual / 100)).toFixed(2))
  const hoje = new Date()
  const proximoReajuste = new Date(hoje)
  proximoReajuste.setFullYear(proximoReajuste.getFullYear() + 1)

  await prisma.$transaction([
    prisma.contrato.update({
      where: { id },
      data: { valor_aluguel: valorNovo, ultimo_reajuste: hoje, proximo_reajuste: proximoReajuste },
    }),
    prisma.historicoReajuste.create({
      data: {
        contrato_id: id,
        data_reajuste: hoje,
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        percentual: data.percentual,
        observacoes: data.observacoes,
      },
    }),
  ])
}

export async function deleteContrato(id: number) {
  const contrato = await getContrato(id)
  if (contrato.status === 'ativo')
    throw new ValidationError('Encerre o contrato antes de excluí-lo.')
  if (contrato.pagamentos.length > 0)
    throw new ValidationError('Não é possível excluir um contrato com pagamentos registrados.')
  return prisma.contrato.delete({ where: { id } })
}

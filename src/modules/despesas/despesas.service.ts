import { prisma } from '../../database'
import { NotFoundError } from '../../shared/errors'
import type { DespesaInput } from './despesas.schema'

export async function listDespesas(filtros: {
  imovel_id?: number; unidade_id?: number; categoria?: string
  mes?: number; ano?: number
}) {
  const where: Record<string, unknown> = {}

  if (filtros.imovel_id) where.imovel_id = filtros.imovel_id
  if (filtros.unidade_id) where.unidade_id = filtros.unidade_id
  if (filtros.categoria) where.categoria = filtros.categoria

  if (filtros.mes && filtros.ano) {
    const inicio = new Date(filtros.ano, filtros.mes - 1, 1)
    const fim = new Date(filtros.ano, filtros.mes, 0, 23, 59, 59)
    where.data_despesa = { gte: inicio, lte: fim }
  } else if (filtros.ano) {
    const inicio = new Date(filtros.ano, 0, 1)
    const fim = new Date(filtros.ano, 11, 31, 23, 59, 59)
    where.data_despesa = { gte: inicio, lte: fim }
  }

  return prisma.despesa.findMany({
    where,
    orderBy: { data_despesa: 'desc' },
    include: {
      imovel: { select: { id: true, nome: true } },
      unidade: { select: { id: true, identificacao: true, imovel: { select: { nome: true } } } },
    },
  })
}

export async function getDespesa(id: number) {
  const despesa = await prisma.despesa.findUnique({
    where: { id },
    include: {
      imovel: { select: { id: true, nome: true } },
      unidade: { select: { id: true, identificacao: true, imovel: { select: { nome: true } } } },
    },
  })
  if (!despesa) throw new NotFoundError('Despesa')
  return despesa
}

export async function listImoveisParaSelect() {
  return prisma.imovel.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } })
}

export async function listUnidadesParaSelect() {
  return prisma.unidade.findMany({
    orderBy: [{ imovel: { nome: 'asc' } }, { identificacao: 'asc' }],
    select: { id: true, identificacao: true, imovel: { select: { nome: true } } },
  })
}

export async function createDespesa(data: DespesaInput) {
  return prisma.despesa.create({
    data: {
      imovel_id: data.imovel_id ?? null,
      unidade_id: data.unidade_id ?? null,
      descricao: data.descricao,
      categoria: data.categoria,
      tipo: data.tipo,
      recorrencia: data.recorrencia,
      valor: data.valor,
      data_despesa: new Date(data.data_despesa),
      observacoes: data.observacoes,
    },
  })
}

export async function updateDespesa(id: number, data: DespesaInput) {
  await getDespesa(id)
  return prisma.despesa.update({
    where: { id },
    data: {
      imovel_id: data.imovel_id ?? null,
      unidade_id: data.unidade_id ?? null,
      descricao: data.descricao,
      categoria: data.categoria,
      tipo: data.tipo,
      recorrencia: data.recorrencia,
      valor: data.valor,
      data_despesa: new Date(data.data_despesa),
      observacoes: data.observacoes,
    },
  })
}

export async function deleteDespesa(id: number) {
  await getDespesa(id)
  return prisma.despesa.delete({ where: { id } })
}

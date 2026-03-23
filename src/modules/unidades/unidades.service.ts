import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
import type { UnidadeInput } from './unidades.schema'

export async function listUnidades(filters?: { status?: string; imovel_id?: number }) {
  return prisma.unidade.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.imovel_id ? { imovel_id: filters.imovel_id } : {}),
    },
    orderBy: [{ imovel: { nome: 'asc' } }, { identificacao: 'asc' }],
    include: {
      imovel: { select: { id: true, nome: true, cidade: true } },
      contratos: {
        where: { status: 'ativo' },
        include: { inquilino: { select: { nome: true, telefone: true } } },
        take: 1,
      },
    },
  })
}

export async function getUnidade(id: number) {
  const unidade = await prisma.unidade.findUnique({
    where: { id },
    include: {
      imovel: true,
      contratos: {
        orderBy: { criado_em: 'desc' },
        include: {
          inquilino: true,
          pagamentos: { orderBy: [{ ano_referencia: 'desc' }, { mes_referencia: 'desc' }], take: 6 },
        },
      },
      despesas: { orderBy: { data_despesa: 'desc' }, take: 10 },
    },
  })
  if (!unidade) throw new NotFoundError('Unidade')
  return unidade
}

export async function listImoveisParaSelect() {
  return prisma.imovel.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } })
}

export async function createUnidade(data: UnidadeInput) {
  return prisma.unidade.create({ data })
}

export async function updateUnidade(id: number, data: UnidadeInput) {
  await getUnidade(id)
  return prisma.unidade.update({ where: { id }, data })
}

export async function deleteUnidade(id: number) {
  const unidade = await getUnidade(id)
  const ativo = unidade.contratos.find((c) => c.status === 'ativo' || c.status === 'suspenso')
  if (ativo) throw new ValidationError('Não é possível excluir uma unidade com contrato ativo.')
  return prisma.unidade.delete({ where: { id } })
}

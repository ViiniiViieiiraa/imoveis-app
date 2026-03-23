import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
import type { InquilinoInput } from './inquilinos.schema'

export async function listInquilinos(busca?: string) {
  return prisma.inquilino.findMany({
    where: busca
      ? { nome: { contains: busca } }
      : undefined,
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { contratos: true } },
      contratos: {
        where: { status: 'ativo' },
        include: { unidade: { select: { identificacao: true, imovel: { select: { nome: true } } } } },
      },
    },
  })
}

export async function getInquilino(id: number) {
  const inquilino = await prisma.inquilino.findUnique({
    where: { id },
    include: {
      contratos: {
        orderBy: { criado_em: 'desc' },
        include: {
          unidade: { include: { imovel: { select: { nome: true } } } },
        },
      },
    },
  })
  if (!inquilino) throw new NotFoundError('Inquilino')
  return inquilino
}

export async function createInquilino(data: InquilinoInput) {
  return prisma.inquilino.create({ data })
}

export async function updateInquilino(id: number, data: InquilinoInput) {
  await getInquilino(id)
  return prisma.inquilino.update({ where: { id }, data })
}

export async function deleteInquilino(id: number) {
  const inquilino = await getInquilino(id)
  const contratoAtivo = inquilino.contratos.find((c) => c.status === 'ativo' || c.status === 'suspenso')
  if (contratoAtivo) throw new ValidationError('Não é possível excluir um inquilino com contrato ativo.')
  return prisma.inquilino.delete({ where: { id } })
}

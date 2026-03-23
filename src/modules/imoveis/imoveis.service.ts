import { prisma } from '../../database'
import { NotFoundError, ValidationError } from '../../shared/errors'
import type { ImovelInput } from './imoveis.schema'

export async function listImoveis() {
  return prisma.imovel.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { unidades: true } },
      unidades: { select: { status: true } },
    },
  })
}

export async function getImovel(id: number) {
  const imovel = await prisma.imovel.findUnique({
    where: { id },
    include: {
      unidades: {
        orderBy: { identificacao: 'asc' },
        include: {
          contratos: {
            where: { status: 'ativo' },
            include: { inquilino: { select: { nome: true } } },
            take: 1,
          },
        },
      },
    },
  })
  if (!imovel) throw new NotFoundError('Imóvel')
  return imovel
}

export async function createImovel(data: ImovelInput) {
  return prisma.imovel.create({ data })
}

export async function updateImovel(id: number, data: ImovelInput) {
  await getImovel(id)
  return prisma.imovel.update({ where: { id }, data })
}

export async function deleteImovel(id: number) {
  const imovel = await getImovel(id)
  const ocupadas = imovel.unidades.filter((u) => u.status === 'ocupada').length
  if (ocupadas > 0)
    throw new ValidationError('Não é possível excluir um imóvel com unidades ocupadas.')
  const totalUnidades = imovel.unidades.length
  if (totalUnidades > 0)
    throw new ValidationError('Remova todas as unidades antes de excluir o imóvel.')
  return prisma.imovel.delete({ where: { id } })
}

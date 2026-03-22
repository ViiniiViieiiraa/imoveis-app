import { prisma } from '../../database'

export type TipoAlerta = 'critico' | 'atencao' | 'info'

export type Alerta = {
  tipo: TipoAlerta
  mensagem: string
  link: string
}

export async function getAlertas(): Promise<Alerta[]> {
  const alertas: Alerta[] = []
  const hoje = new Date()
  const em30Dias = new Date(hoje)
  em30Dias.setDate(em30Dias.getDate() + 30)
  const em60Dias = new Date(hoje)
  em60Dias.setDate(em60Dias.getDate() + 60)

  const pagamentosAtrasados = await prisma.pagamento.findMany({
    where: { status: 'pendente', data_vencimento: { lt: hoje } },
    include: {
      contrato: {
        select: {
          id: true,
          inquilino: { select: { nome: true } },
          unidade: { select: { identificacao: true } },
        },
      },
    },
  })

  for (const p of pagamentosAtrasados) {
    alertas.push({
      tipo: 'critico',
      mensagem: `Pagamento atrasado: ${p.contrato.inquilino.nome} — ${p.contrato.unidade.identificacao} (${p.mes_referencia}/${p.ano_referencia})`,
      link: `/contratos/${p.contrato_id}`,
    })
  }

  const reajustesVencidos = await prisma.contrato.findMany({
    where: { status: 'ativo', proximo_reajuste: { lt: hoje } },
    select: {
      id: true,
      inquilino: { select: { nome: true } },
      unidade: { select: { identificacao: true } },
    },
  })

  for (const c of reajustesVencidos) {
    alertas.push({
      tipo: 'critico',
      mensagem: `Reajuste vencido: ${c.inquilino.nome} — ${c.unidade.identificacao}`,
      link: `/contratos/${c.id}`,
    })
  }

  const reajustesProximos = await prisma.contrato.findMany({
    where: {
      status: 'ativo',
      proximo_reajuste: { gte: hoje, lte: em30Dias },
    },
    select: {
      id: true,
      inquilino: { select: { nome: true } },
      unidade: { select: { identificacao: true } },
    },
  })

  for (const c of reajustesProximos) {
    alertas.push({
      tipo: 'atencao',
      mensagem: `Reajuste em breve: ${c.inquilino.nome} — ${c.unidade.identificacao}`,
      link: `/contratos/${c.id}`,
    })
  }

  const contratosVencendo = await prisma.contrato.findMany({
    where: {
      status: 'ativo',
      data_fim: { gte: hoje, lte: em60Dias },
    },
    select: {
      id: true,
      inquilino: { select: { nome: true } },
      unidade: { select: { identificacao: true } },
    },
  })

  for (const c of contratosVencendo) {
    alertas.push({
      tipo: 'atencao',
      mensagem: `Contrato vencendo: ${c.inquilino.nome} — ${c.unidade.identificacao}`,
      link: `/contratos/${c.id}`,
    })
  }

  const vagasCount = await prisma.unidade.count({ where: { status: 'vaga' } })
  if (vagasCount > 0) {
    alertas.push({
      tipo: 'info',
      mensagem: `${vagasCount} unidade${vagasCount > 1 ? 's' : ''} vaga${vagasCount > 1 ? 's' : ''} sem inquilino`,
      link: '/unidades',
    })
  }

  return alertas
}
import { prisma } from '../../database'

export async function getDashboardData() {
  const [totalImoveis, totalUnidades, unidadesOcupadas, totalInquilinos] =
    await Promise.all([
      prisma.imovel.count(),
      prisma.unidade.count(),
      prisma.unidade.count({ where: { status: 'ocupada' } }),
      prisma.inquilino.count(),
    ])

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()
  const inicioMes = new Date(anoAtual, hoje.getMonth(), 1)
  const fimMes = new Date(anoAtual, hoje.getMonth() + 1, 0, 23, 59, 59)

  const pagamentosMes = await prisma.pagamento.findMany({
    where: { mes_referencia: mesAtual, ano_referencia: anoAtual },
  })

  const receitaMes = pagamentosMes
    .filter((p) => p.status === 'pago')
    .reduce((acc: number, p) => acc + Number(p.valor_pago ?? 0), 0)

  const despesasMes = await prisma.despesa.findMany({
    where: { data_despesa: { gte: inicioMes, lte: fimMes } },
  })

  const totalDespesasMes = despesasMes.reduce(
    (acc: number, d) => acc + Number(d.valor),
    0,
  )

  const pagamentosPendentes = pagamentosMes.filter((p) => p.status === 'pendente').length
  const pagamentosAtrasados = pagamentosMes.filter((p) => p.status === 'atrasado').length

  const em30Dias = new Date(hoje)
  em30Dias.setDate(em30Dias.getDate() + 30)

  const [reajustesProximos, reajustesVencidos] = await Promise.all([
    prisma.contrato.count({
      where: { status: 'ativo', proximo_reajuste: { gte: hoje, lte: em30Dias } },
    }),
    prisma.contrato.count({
      where: { status: 'ativo', proximo_reajuste: { lt: hoje } },
    }),
  ])

  return {
    totalImoveis,
    totalUnidades,
    unidadesOcupadas,
    unidadesVagas: totalUnidades - unidadesOcupadas,
    totalInquilinos,
    receitaMes,
    totalDespesasMes,
    lucroLiquido: receitaMes - totalDespesasMes,
    pagamentosPendentes,
    pagamentosAtrasados,
    reajustesProximos,
    reajustesVencidos,
  }
}
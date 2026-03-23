import 'dotenv/config'
import { prisma } from '../src/database'

async function seed() {
  console.log('Inserindo dados de exemplo...\n')

  const imovel = await prisma.imovel.create({
    data: {
      nome: 'Edifício Central',
      endereco: 'Rua das Flores, 123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-000',
      tipo: 'residencial',
      valor_imovel: 850000,
    },
  })

  const [u1, u2, u3] = await Promise.all([
    prisma.unidade.create({ data: { imovel_id: imovel.id, identificacao: 'Apto 101', tipo: 'apartamento', valor_aluguel: 1500, dia_vencimento: 10, status: 'vaga' } }),
    prisma.unidade.create({ data: { imovel_id: imovel.id, identificacao: 'Apto 102', tipo: 'apartamento', valor_aluguel: 1800, dia_vencimento: 5,  status: 'vaga' } }),
    prisma.unidade.create({ data: { imovel_id: imovel.id, identificacao: 'Apto 201', tipo: 'apartamento', valor_aluguel: 2200, dia_vencimento: 15, status: 'vaga' } }),
  ])

  const [inq1, inq2] = await Promise.all([
    prisma.inquilino.create({ data: { nome: 'Maria Silva', cpf_cnpj: '123.456.789-00', telefone: '(11) 99999-1234', email: 'maria@email.com', tipo_pessoa: 'fisica' } }),
    prisma.inquilino.create({ data: { nome: 'João Santos', cpf_cnpj: '987.654.321-00', telefone: '(11) 98888-5678', email: 'joao@email.com', tipo_pessoa: 'fisica' } }),
  ])

  const hoje = new Date()
  const inicioContrato1 = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1)
  const proximoReajuste1 = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const contrato1 = await prisma.contrato.create({
    data: {
      unidade_id: u1.id,
      inquilino_id: inq1.id,
      data_inicio: inicioContrato1,
      valor_aluguel: 1500,
      dia_vencimento: 10,
      proximo_reajuste: proximoReajuste1,
      status: 'ativo',
    },
  })
  await prisma.unidade.update({ where: { id: u1.id }, data: { status: 'ocupada' } })

  const inicioContrato2 = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
  const proximoReajuste2 = new Date(hoje.getFullYear() + 1, hoje.getMonth() - 2, 1)

  const contrato2 = await prisma.contrato.create({
    data: {
      unidade_id: u2.id,
      inquilino_id: inq2.id,
      data_inicio: inicioContrato2,
      valor_aluguel: 1800,
      dia_vencimento: 5,
      proximo_reajuste: proximoReajuste2,
      status: 'ativo',
    },
  })
  await prisma.unidade.update({ where: { id: u2.id }, data: { status: 'ocupada' } })

  // Pagamentos do mês corrente
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()

  await Promise.all([
    prisma.pagamento.create({
      data: {
        contrato_id: contrato1.id,
        mes_referencia: mesAtual,
        ano_referencia: anoAtual,
        valor_previsto: 1500,
        data_vencimento: new Date(anoAtual, mesAtual - 1, 10),
        status: 'pago',
        valor_pago: 1500,
        data_pagamento: new Date(anoAtual, mesAtual - 1, 9),
      },
    }),
    prisma.pagamento.create({
      data: {
        contrato_id: contrato2.id,
        mes_referencia: mesAtual,
        ano_referencia: anoAtual,
        valor_previsto: 1800,
        data_vencimento: new Date(anoAtual, mesAtual - 1, 5),
        status: 'pendente',
      },
    }),
  ])

  // Despesas
  await prisma.despesa.create({
    data: {
      imovel_id: imovel.id,
      descricao: 'IPTU 2024',
      categoria: 'imposto',
      tipo: 'anual',
      recorrencia: 'anual',
      valor: 3200,
      data_despesa: new Date(anoAtual, 0, 15),
    },
  })
  await prisma.despesa.create({
    data: {
      unidade_id: u1.id,
      descricao: 'Troca de torneira',
      categoria: 'manutencao',
      tipo: 'avulsa',
      valor: 180,
      data_despesa: new Date(anoAtual, mesAtual - 1, 8),
    },
  })

  console.log('✓ Imóvel: Edifício Central')
  console.log(`✓ 3 unidades (${u1.identificacao}, ${u2.identificacao}, ${u3.identificacao})`)
  console.log(`✓ 2 inquilinos (${inq1.nome}, ${inq2.nome})`)
  console.log('✓ 2 contratos ativos')
  console.log('✓ 2 pagamentos do mês (1 pago, 1 pendente)')
  console.log('✓ 2 despesas de exemplo')
  console.log('\nDados de exemplo inseridos com sucesso.')
}

seed()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())

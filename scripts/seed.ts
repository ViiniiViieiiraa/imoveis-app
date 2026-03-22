import 'dotenv/config'
import { prisma } from '../src/database'

async function seed() {
  console.log('Inserindo dados de exemplo...')

  const imovel = await prisma.imovel.create({
    data: {
      nome: 'Edifício Central',
      endereco: 'Rua das Flores, 123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      tipo: 'residencial',
      valor_imovel: 850000,
    },
  })

  await prisma.unidade.createMany({
    data: [
      { imovel_id: imovel.id, identificacao: 'Apto 101', tipo: 'apartamento', valor_aluguel: 1500, dia_vencimento: 10, status: 'vaga' },
      { imovel_id: imovel.id, identificacao: 'Apto 102', tipo: 'apartamento', valor_aluguel: 1600, dia_vencimento: 5,  status: 'vaga' },
      { imovel_id: imovel.id, identificacao: 'Apto 201', tipo: 'apartamento', valor_aluguel: 1800, dia_vencimento: 10, status: 'vaga' },
    ],
  })

  console.log('Dados inseridos com sucesso.')
  console.log(`  Imóvel: ${imovel.nome}`)
  console.log(`  3 unidades criadas`)
}

seed()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
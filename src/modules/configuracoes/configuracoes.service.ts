import { prisma } from '../../database'

export const TEMPLATE_PADRAO = `Olá, {nome}! 👋

Passando para lembrá-lo do aluguel referente a *{mes_referencia}*.

📋 Unidade: {unidade} — {imovel}
💰 Valor: *{valor}*
📅 Vencimento: *{vencimento}*
{saldo_anterior}
Em caso de dúvidas, entre em contato. Obrigado!`

export async function getConfig(chave: string): Promise<string | null> {
  const config = await prisma.configuracao.findUnique({ where: { chave } })
  return config?.valor ?? null
}

export async function setConfig(chave: string, valor: string): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave },
    update: { valor },
    create: { chave, valor },
  })
}

export async function getTemplateCobranca(): Promise<string> {
  return (await getConfig('template_cobranca')) ?? TEMPLATE_PADRAO
}

export async function getTodasConfigs(): Promise<Record<string, string>> {
  const configs = await prisma.configuracao.findMany()
  return Object.fromEntries(configs.map((c) => [c.chave, c.valor]))
}

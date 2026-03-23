import { z } from 'zod'

export const registrarPagamentoSchema = z.object({
  valor_pago: z.coerce.number().positive('Informe o valor pago'),
  data_pagamento: z.string().min(1, 'Informe a data do pagamento'),
  observacoes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
})

export const gerarCobrancasSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2000),
})

export const editarPagamentoSchema = z.object({
  status: z.enum(['pendente', 'pago', 'atrasado', 'isento']),
  valor_pago: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().positive().nullable().optional(),
  ),
  data_pagamento: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  observacoes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
})

export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>
export type GerarCobrancasInput = z.infer<typeof gerarCobrancasSchema>
export type EditarPagamentoInput = z.infer<typeof editarPagamentoSchema>

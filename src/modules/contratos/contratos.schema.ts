import { z } from 'zod'

export const contratoSchema = z.object({
  unidade_id: z.coerce.number().int().positive('Selecione uma unidade'),
  inquilino_id: z.coerce.number().int().positive('Selecione um inquilino'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  valor_aluguel: z.coerce.number().positive('Valor do aluguel é obrigatório'),
  dia_vencimento: z.coerce.number().int().min(1).max(28, 'Use entre 1 e 28'),
  observacoes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
})

export const reajusteSchema = z.object({
  percentual: z.coerce.number().positive('Informe o percentual de reajuste'),
  observacoes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
})

export type ContratoInput = z.infer<typeof contratoSchema>
export type ReajusteInput = z.infer<typeof reajusteSchema>

import { z } from 'zod'

export const unidadeSchema = z.object({
  imovel_id: z.coerce.number().int().positive('Selecione um imóvel'),
  identificacao: z.string().min(1, 'Identificação é obrigatória'),
  tipo: z.enum(['apartamento', 'casa', 'sala', 'galpao', 'outro']).default('apartamento'),
  area_m2: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().positive().nullable().optional(),
  ),
  valor_aluguel: z.coerce.number().positive('Valor do aluguel é obrigatório'),
  dia_vencimento: z.coerce.number().int().min(1).max(28, 'Use entre 1 e 28'),
  status: z.enum(['vaga', 'ocupada', 'indisponivel']).default('vaga'),
  observacoes: z.string().optional(),
})

export type UnidadeInput = z.infer<typeof unidadeSchema>

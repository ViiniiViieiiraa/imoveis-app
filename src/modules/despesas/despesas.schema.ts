import { z } from 'zod'

export const despesaSchema = z.object({
  imovel_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().int().positive().nullable().optional(),
  ),
  unidade_id: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().int().positive().nullable().optional(),
  ),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  tipo: z.enum(['avulsa', 'recorrente']).default('avulsa'),
  recorrencia: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  valor: z.coerce.number().positive('Valor é obrigatório'),
  data_despesa: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
}).refine((d) => d.imovel_id != null || d.unidade_id != null, {
  message: 'Selecione um imóvel ou uma unidade',
  path: ['imovel_id'],
})

export type DespesaInput = z.infer<typeof despesaSchema>

export const CATEGORIAS = [
  'manutencao', 'imposto', 'seguro', 'condominio',
  'agua', 'luz', 'gas', 'internet', 'outro',
] as const

export const CATEGORIAS_LABELS: Record<string, string> = {
  manutencao: 'Manutenção',
  imposto: 'Imposto (IPTU/ITR)',
  seguro: 'Seguro',
  condominio: 'Condomínio',
  agua: 'Água',
  luz: 'Energia elétrica',
  gas: 'Gás',
  internet: 'Internet',
  outro: 'Outro',
}

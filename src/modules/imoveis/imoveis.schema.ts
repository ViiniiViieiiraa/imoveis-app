import { z } from 'zod'

export const imovelSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  bairro: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)').default('SP'),
  cep: z.string().optional(),
  tipo: z.enum(['residencial', 'comercial', 'misto']).default('residencial'),
  valor_imovel: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional(),
  ),
  observacoes: z.string().optional(),
})

export type ImovelInput = z.infer<typeof imovelSchema>
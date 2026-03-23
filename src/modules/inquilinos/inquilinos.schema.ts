import { z } from 'zod'

export const inquilinoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf_cnpj: z.string().optional().transform((v) => v === '' ? undefined : v),
  telefone: z.string().optional().transform((v) => v === '' ? undefined : v),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  tipo_pessoa: z.enum(['fisica', 'juridica']).default('fisica'),
  observacoes: z.string().optional().transform((v) => v === '' ? undefined : v),
})

export type InquilinoInput = z.infer<typeof inquilinoSchema>

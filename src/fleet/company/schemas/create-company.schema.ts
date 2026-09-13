import { z } from 'zod'

export const createCompanySchema = z.object({
  tenantId: z.string().uuid('tenantId deve ser um UUID válido').optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  taxId: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((val) => val.length === 11 || val.length === 14, {
      message: 'taxId deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)',
    }),
  type: z.enum(['CLIENT', 'RENTAL', 'MAINTENANCE']),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>

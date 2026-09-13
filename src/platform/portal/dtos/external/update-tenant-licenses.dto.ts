import { z } from 'zod'

export const updateTenantLicensesSchema = z.object({
  enabledModules: z
    .array(z.string().min(2))
    .min(1, 'Pelo menos um módulo deve permanecer habilitado'),
  planTier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).optional(),
})

export type UpdateTenantLicensesDto = z.infer<typeof updateTenantLicensesSchema>

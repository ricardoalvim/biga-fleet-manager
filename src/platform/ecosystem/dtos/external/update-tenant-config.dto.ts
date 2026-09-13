import { z } from 'zod'

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

export const updateTenantConfigSchema = z.object({
  displayName: z.string().min(2).max(100),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Cor primária inválida. Formato esperado: #RRGGBB')
    .optional(),
  secondaryColor: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Cor secundária inválida. Formato esperado: #RRGGBB')
    .optional(),
  enabledModules: z.array(z.string()).optional(),
  customTerminology: z.record(z.string(), z.string()).optional(),
})

export type UpdateTenantConfigDto = z.infer<typeof updateTenantConfigSchema>

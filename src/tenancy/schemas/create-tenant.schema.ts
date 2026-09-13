import { z } from 'zod'

export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

import { z } from 'zod'

export const maintenancePlanItemSchema = z.object({
  description: z.string().min(2).max(200),
  action: z.enum(['INSPECTION', 'REPLACEMENT']),
})

export const createMaintenancePlanSchema = z.object({
  tenantId: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  triggerKm: z.number().positive(),
  items: z.array(maintenancePlanItemSchema).min(1),
})

export type CreateMaintenancePlanDto = z.infer<typeof createMaintenancePlanSchema>

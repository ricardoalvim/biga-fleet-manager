import { z } from 'zod'

export const createMaintenanceOrderSchema = z.object({
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  providerId: z.string().uuid(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE']).default('CORRECTIVE'),
  scheduledDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
})

export type CreateMaintenanceOrderDto = z.infer<typeof createMaintenanceOrderSchema>

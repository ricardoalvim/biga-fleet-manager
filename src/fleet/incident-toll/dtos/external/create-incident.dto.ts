import { z } from 'zod'

export const createIncidentSchema = z.object({
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  responsibleCompanyId: z.string().uuid(),
  incidentType: z.enum(['ACCIDENT', 'FINE', 'DAMAGE', 'THEFT', 'OTHER']),
  description: z.string().min(3).max(500),
  estimatedCost: z.number().nonnegative().default(0),
  occurredAt: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
})

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>

import { z } from 'zod'

export const startTripSchema = z.object({
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
})

export type StartTripDto = z.infer<typeof startTripSchema>

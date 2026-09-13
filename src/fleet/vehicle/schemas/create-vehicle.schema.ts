import { z } from 'zod'

export const createVehicleSchema = z.object({
  plate: z.string().min(1),
  model: z.string().min(1),
  ownerId: z.uuid(),
  contractorId: z.uuid(),
  custodianId: z.uuid(),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

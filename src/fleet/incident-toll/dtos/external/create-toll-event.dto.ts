import { z } from 'zod'

export const createTollEventSchema = z.object({
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  tollPlazaName: z.string().min(2).max(150),
  externalTransactionId: z.string().min(2).max(100),
  amount: z.number().nonnegative(),
  passedAt: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
})

export type CreateTollEventDto = z.infer<typeof createTollEventSchema>

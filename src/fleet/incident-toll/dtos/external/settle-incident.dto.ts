import { z } from 'zod'

export const settleIncidentSchema = z.object({
  actualCost: z.number().nonnegative(),
})

export type SettleIncidentDto = z.infer<typeof settleIncidentSchema>

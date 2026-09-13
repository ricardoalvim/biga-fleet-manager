import { z } from 'zod'

export const executedMaintenanceItemSchema = z.object({
  description: z.string().min(2).max(200),
  action: z.enum(['INSPECTION', 'REPLACEMENT']),
  partCost: z.number().nonnegative().default(0),
  laborCost: z.number().nonnegative().default(0),
})

export const completeMaintenanceOrderSchema = z.object({
  downtimeHours: z.number().nonnegative().default(0),
  downtimeCostPerHour: z.number().nonnegative().default(0),
  executedItems: z.array(executedMaintenanceItemSchema).min(1),
})

export type CompleteMaintenanceOrderDto = z.infer<typeof completeMaintenanceOrderSchema>

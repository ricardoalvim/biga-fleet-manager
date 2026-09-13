import { z } from 'zod'

export const gasStationLocationSchema = z.object({
  name: z.string().min(2).max(150),
  cnpj: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
})

export const reconcileFuelTransactionSchema = z.object({
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().min(1),
  plate: z.string().min(5).max(10),
  driverId: z.string().optional(),
  gasStation: gasStationLocationSchema,
  timestamp: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  fuelType: z.enum([
    'DIESEL_S10',
    'DIESEL_S500',
    'GASOLINE',
    'ETHANOL',
    'CNG',
    'ARLA32',
  ]),
  liters: z.number().positive(),
  pricePerLiter: z.number().positive(),
  totalValue: z.number().positive(),
  reportedOdometerKm: z.number().nonnegative(),
  notes: z.string().optional(),
})

export type ReconcileFuelTransactionDto = z.infer<typeof reconcileFuelTransactionSchema>

export const batchReconcileFuelTransactionsSchema = z.object({
  tenantId: z.string().uuid().optional(),
  operator: z.enum(['TICKET_LOG', 'VALECARD', 'GOOD_CARD', 'SHELL_BOX', 'IPIRANGA', 'CUSTOM']),
  transactions: z.array(reconcileFuelTransactionSchema).min(1).max(500),
})

export type BatchReconcileFuelTransactionsDto = z.infer<typeof batchReconcileFuelTransactionsSchema>

export const ingestLegacyFuelFileSchema = z.object({
  tenantId: z.string().uuid().optional(),
  operator: z.enum(['TICKET_LOG', 'VALECARD', 'GOOD_CARD', 'CUSTOM']),
  content: z.string().min(5),
})

export type IngestLegacyFuelFileDto = z.infer<typeof ingestLegacyFuelFileSchema>


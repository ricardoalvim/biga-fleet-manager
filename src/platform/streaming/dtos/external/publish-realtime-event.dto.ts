import { z } from 'zod'

export const publishRealtimeEventSchema = z.object({
  event: z.enum(['vehicle.position.updated', 'trip.status.changed', 'geofence.alert']),
  tenantId: z.string().uuid().optional(),
  vehicleId: z.string().min(1, 'vehicleId é obrigatório'),
  data: z.record(z.string(), z.unknown()),
})

export type PublishRealtimeEventDto = z.infer<typeof publishRealtimeEventSchema>

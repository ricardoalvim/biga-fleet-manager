import { z } from 'zod'

export const ingestTelemetrySchema = z.object({
  tenantId: z.uuid(),
  deviceId: z.uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number(),
  ignition: z.boolean(),
  timestamp: z.iso.datetime().optional(),
})

export type IngestTelemetryInput = z.infer<typeof ingestTelemetrySchema>

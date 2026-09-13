import { z } from 'zod'

export const createRouteProfileSchema = z.object({
  tenantId: z.string().uuid().optional(),
  name: z.string().min(3).max(120),
  businessContext: z.enum(['DELIVERY', 'PASSENGER', 'HEAVY_CARGO', 'AGRICULTURAL']),
  customTerminology: z.object({
    stopPointLabel: z.string().min(1).max(60),
    assetLabel: z.string().min(1).max(60),
    routeLabel: z.string().min(1).max(60),
  }),
  physicalConstraints: z.object({
    maxWeightTons: z.number().nonnegative(),
    maxHeightMeters: z.number().nonnegative(),
    allowUnpavedRoads: z.boolean().default(false),
    maxSpeedKmh: z.number().positive(),
  }),
})

export type CreateRouteProfileDto = z.infer<typeof createRouteProfileSchema>

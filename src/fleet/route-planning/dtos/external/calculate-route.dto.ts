import { z } from 'zod'

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
})

export const waypointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sequence: z.number().int().nonnegative(),
  address: z.string().optional(),
})

export const calculateRouteSchema = z.object({
  tenantId: z.string().uuid().optional(),
  profileId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  origin: geoPointSchema,
  destination: geoPointSchema,
  waypoints: z.array(waypointSchema).default([]),
})

export type GeoPointDto = z.infer<typeof geoPointSchema>
export type WaypointDto = z.infer<typeof waypointSchema>
export type CalculateRouteDto = z.infer<typeof calculateRouteSchema>

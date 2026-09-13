import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import { GeocodingService } from '../../../platform/geo/geocoding.service.js'
import type { PlannedRouteInternalDto } from '../dtos/internal/planned-route.internal.dto.js'

@Injectable()
export class RoutePlanningExternalService {
  private readonly logger = new Logger(RoutePlanningExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    private readonly geocodingService: GeocodingService,
    config: ConfigService,
  ) {
    this.channel = config.get<string>(
      'REDIS_ROUTE_PLANNING_CHANNEL',
      'route_planning_events_stream',
    )
  }

  async resolveAddress(lat: number, lng: number): Promise<string> {
    try {
      return await this.geocodingService.reverse(lat, lng)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to reverse geocode coordinate (${lat}, ${lng}): ${message}`)
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    }
  }

  async notifyRouteCalculated(route: Readonly<PlannedRouteInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'ROUTE_CALCULATED',
      routeId: route.id,
      tenantId: route.tenantId,
      profileId: route.profileId,
      vehicleId: route.vehicleId,
      distanceKm: route.distanceKm,
      estimatedDurationMinutes: route.estimatedDurationMinutes,
      projectedFuelLiters: route.projectedFuelLiters,
      waypointsCount: route.waypoints.length,
      createdAt: route.createdAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted ROUTE_CALCULATED for route ${route.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast ROUTE_CALCULATED event: ${message}`)
    }
  }

  async notifyRouteDispatched(route: Readonly<PlannedRouteInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'ROUTE_DISPATCHED',
      routeId: route.id,
      tenantId: route.tenantId,
      profileId: route.profileId,
      vehicleId: route.vehicleId,
      distanceKm: route.distanceKm,
      estimatedDurationMinutes: route.estimatedDurationMinutes,
      status: route.status,
      dispatchedAt: route.dispatchedAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted ROUTE_DISPATCHED for route ${route.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast ROUTE_DISPATCHED event: ${message}`)
    }
  }
}

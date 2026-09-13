import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { GeocodingService } from '../../../platform/geo/geocoding.service.js'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import type { TripInternalDto } from '../dtos/internal/trip.internal.dto.js'

@Injectable()
export class TripExternalService {
  private readonly logger = new Logger(TripExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    private readonly geocoding: GeocodingService,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_TRIP_CHANNEL', 'trip_events_stream')
  }

  async notifyTripStarted(trip: Readonly<TripInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'TRIP_STARTED',
      tripId: trip.id,
      tenantId: trip.tenantId,
      vehicleId: trip.vehicleId,
      startedAt: trip.startedAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted TRIP_STARTED for trip ${trip.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast TRIP_STARTED event: ${message}`)
    }
  }

  async notifyTripFinished(trip: Readonly<TripInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'TRIP_FINISHED',
      tripId: trip.id,
      tenantId: trip.tenantId,
      vehicleId: trip.vehicleId,
      endedAt: trip.endedAt,
      distanceKm: trip.distanceKm,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted TRIP_FINISHED for trip ${trip.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast TRIP_FINISHED event: ${message}`)
    }
  }

  async resolveAddress(lat: number, lng: number): Promise<string> {
    try {
      return await this.geocoding.reverse(lat, lng)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to resolve address for [${lat}, ${lng}]: ${message}`)
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    }
  }
}

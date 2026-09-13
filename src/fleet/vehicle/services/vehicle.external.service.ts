import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import { VehicleInternalService } from './vehicle.internal.service.js'
import type { VehicleInternalDto } from '../dtos/internal/vehicle.internal.dto.js'
import type { CreateVehicleRequestDto } from '../dtos/external/create-vehicle.dto.js'

export interface VehicleRegisteredEvent {
  readonly event: 'VEHICLE_REGISTERED'
  readonly vehicleId: string
  readonly tenantId: string
  readonly plate: string
  readonly timestamp: string
}

@Injectable()
export class VehicleExternalService {
  private readonly logger = new Logger(VehicleExternalService.name)

  constructor(
    private readonly vehicleInternal: VehicleInternalService,
    @Optional() @Inject(REDIS_PUBLISHER) private readonly redisPublisher?: Redis,
  ) {}

  async registerAndBroadcast(dto: CreateVehicleRequestDto): Promise<Readonly<VehicleInternalDto>> {
    const vehicle = await this.vehicleInternal.create(dto)

    if (this.redisPublisher) {
      const eventPayload: VehicleRegisteredEvent = {
        event: 'VEHICLE_REGISTERED',
        vehicleId: vehicle.id,
        tenantId: vehicle.tenantId,
        plate: vehicle.plate,
        timestamp: new Date().toISOString(),
      }

      try {
        await this.redisPublisher.publish('vehicle_events_stream', JSON.stringify(eventPayload))
        this.logger.log(`Broadcasted VEHICLE_REGISTERED for plate ${vehicle.plate}`)
      } catch (err) {
        this.logger.warn(`Failed to broadcast vehicle registration event: ${String(err)}`)
      }
    }

    return vehicle
  }

  async getVehicleForTelemetry(
    tenantId: string,
    vehicleIdOrPlate: string,
  ): Promise<Readonly<VehicleInternalDto> | null> {
    try {
      return await this.vehicleInternal.findById(vehicleIdOrPlate)
    } catch {
      try {
        return await this.vehicleInternal.findByPlate(vehicleIdOrPlate)
      } catch {
        return null
      }
    }
  }
}

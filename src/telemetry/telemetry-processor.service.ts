import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Redis } from 'ioredis'
import { Model } from 'mongoose'
import { TripService } from '../fleet/trip/trip.service.js'
import { REDIS_SUBSCRIBER } from '../platform/redis/redis.tokens.js'
import { Telemetry } from './telemetry.document.js'

@Injectable()
export class TelemetryProcessorService implements OnModuleInit {
  private readonly logger = new Logger(TelemetryProcessorService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
    private readonly trips: TripService,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_TELEMETRY_CHANNEL', 'vehicle_telemetry_stream')
  }

  onModuleInit() {
    void this.redisSubscriber.subscribe(this.channel, (err, count) => {
      if (err) {
        this.logger.error(`Failed to subscribe ${this.channel}`, err)
        return
      }
      this.logger.log(`Subscribed to ${this.channel} (${String(count)} channel(s))`)
    })

    this.redisSubscriber.on('message', (chan, msg) => {
      if (chan === this.channel) {
        void this.processIncomingTelemetry(msg)
      }
    })
  }

  private async processIncomingTelemetry(message: string) {
    try {
      const payload = JSON.parse(message) as {
        tenantId: string
        deviceId: string
        ignition: boolean
        lat: number
        lng: number
        speed?: number
        timestamp?: string
      }

      const { tenantId, deviceId, ignition, lat, lng, speed, timestamp } = payload
      const vehicleId = deviceId

      let activeTrip = await this.trips.findActiveByVehicle(tenantId, vehicleId)

      if (ignition && !activeTrip) {
        activeTrip = await this.trips.startTrip(vehicleId, tenantId)
        this.logger.log(`Trip started ${activeTrip.id}`, { tenantId, vehicleId })
      }

      if (activeTrip) {
        await this.telemetryModel.create({
          tenantId,
          deviceId,
          vehicleId,
          tripId: activeTrip.id,
          latitude: lat,
          longitude: lng,
          speed: speed || 0,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        })
      }

      if (!ignition && activeTrip) {
        await this.trips.finishTrip(activeTrip.id, tenantId)
        this.logger.log(`Trip finished ${activeTrip.id}`, { tenantId, vehicleId })
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      this.logger.error(`Telemetry processing failed: ${messageText}`)
    }
  }
}

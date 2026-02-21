import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Telemetry } from './schemas/telemetry.schema'
import { TripService } from '../trip/trip.service'

@Injectable()
export class TelemetrySubscriberService implements OnModuleInit {
  private readonly logger = new Logger(TelemetrySubscriberService.name)
  private readonly channel: string

  constructor(
    @Inject('REDIS_SUBSCRIBER_CLIENT') private readonly redisSubscriber: Redis,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
    private readonly tripService: TripService,
    private readonly configService: ConfigService,
  ) {
    this.channel = this.configService.get<string>('REDIS_TELEMETRY_CHANNEL') || 'default_stream'
  }

  onModuleInit() {
    this.redisSubscriber.subscribe(this.channel, (err, count) => {
      if (err) {
        this.logger.error(`Falha ao assinar o canal ${this.channel}`, err)
        return
      }
      this.logger.log(`Inscrito no canal ${this.channel}. Ouvindo ${count} canal(is).`)
    })

    this.redisSubscriber.on('message', (chan, msg) => {
      if (chan === this.channel) this.processIncomingTelemetry(msg)
    })
  }

  private async processIncomingTelemetry(message: string) {
    try {
      const payload = JSON.parse(message)
      const { bigaId, isHitched, lat, lng, speed, timestamp } = payload

      let activeTrip = await this.tripService.findActiveByChariot(bigaId)

      if (isHitched && !activeTrip) {
        activeTrip = await this.tripService.startTrip(bigaId)
        this.logger.log(`[LIFECYCLE] Nova trip iniciada: ${activeTrip.id}`)
      }

      if (activeTrip) {
        await new this.telemetryModel({
          chariotId: bigaId,
          tripId: activeTrip.id,
          latitude: lat,
          longitude: lng,
          speed: speed || 0,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        }).save()
      }

      if (!isHitched && activeTrip) {
        await this.tripService.finishTrip(activeTrip.id)
        this.logger.log(`[LIFECYCLE] Trip finalizada e calculada: ${activeTrip.id}`)
      }
    } catch (error) {
      this.logger.error('Erro no processamento da Legião:', error.message)
    }
  }
}

import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Telemetry } from './schemas/telemetry.schema'

@Injectable()
export class TelemetrySubscriberService implements OnModuleInit {
  private readonly logger = new Logger(TelemetrySubscriberService.name)
  private readonly channel: string

  constructor(
    @Inject('REDIS_SUBSCRIBER_CLIENT') private readonly redisSubscriber: Redis,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>, // Injetando o Mongo
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

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === this.channel) {
        this.processIncomingTelemetry(message)
      }
    })
  }

  private async processIncomingTelemetry(message: string) {
    try {
      const payload = JSON.parse(message)

      if (!payload.tripId) {
        this.logger.warn(`[SKIP] Telemetria sem tripId recebida da biga ${payload.bigaId}`)
        return
      }

      const record = new this.telemetryModel({
        chariotId: payload.bigaId || payload.chariotId,
        tripId: payload.tripId,
        latitude: payload.lat,
        longitude: payload.lng,
        speed: payload.speed || 0,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
      })

      await record.save()
      this.logger.log(`[MONGO] Sucesso: Trip ${payload.tripId} | Biga ${payload.bigaId}`)

    } catch (error) {
      this.logger.error('Erro fatal no save do Mongo:', error.message)
    }
  }
}
import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'

@Injectable()
export class TelemetrySubscriberService implements OnModuleInit {
  private readonly logger = new Logger(TelemetrySubscriberService.name)
  private readonly channel: string

  constructor(
    @Inject('REDIS_SUBSCRIBER_CLIENT') private readonly redisSubscriber: Redis,
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

  private processIncomingTelemetry(message: string) {
    const payload = JSON.parse(message)
    this.logger.log(
      `[TELEMETRIA RECEBIDA] Biga: ${payload.bigaId} | Lat: ${payload.lat}, Lng: ${payload.lng} | Ignição: ${payload.isHitched}`,
    )
  }
}

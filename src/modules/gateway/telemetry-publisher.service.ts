import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { TelemetryIngestionDto } from './telemetry-ingestion.dto'

@Injectable()
export class TelemetryPublisherService {
  private readonly channel: string

  constructor(
    @Inject('REDIS_PUBLISHER_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    this.channel = this.configService.get<string>('REDIS_TELEMETRY_CHANNEL') || 'default_stream'
  }

  async publishLocation(payload: TelemetryIngestionDto): Promise<void> {
    const message = JSON.stringify({
      ...payload,
      receivedAt: new Date().toISOString(),
    })

    await this.redisClient.publish(this.channel, message)
  }
}

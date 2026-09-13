import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../platform/redis/redis.tokens.js'
import type { IngestTelemetryInput } from './schemas/ingest-telemetry.schema.js'

@Injectable()
export class IngestionPublisher {
  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async publish(payload: IngestTelemetryInput) {
    const channel = this.config.get<string>('REDIS_TELEMETRY_CHANNEL', 'vehicle_telemetry_stream')
    await this.redis.publish(
      channel,
      JSON.stringify({
        ...payload,
        receivedAt: new Date().toISOString(),
      }),
    )
  }
}

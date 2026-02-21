import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto'

@Injectable()
export class GatewayService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async ingest(dto: IngestTelemetryDto) {
    const channel = process.env.REDIS_TELEMETRY_CHANNEL || 'biga_telemetry_stream'

    await this.redis.publish(channel, JSON.stringify(dto))

    return { success: true, queuedAt: new Date().toISOString() }
  }
}

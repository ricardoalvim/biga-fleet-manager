import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../redis/redis.tokens.js'
import type { PublishRealtimeEventDto } from '../dtos/external/publish-realtime-event.dto.js'
import { RealtimeStreamingInternalService } from './realtime-streaming.internal.service.js'

@Injectable()
export class RealtimeStreamingExternalService {
  private readonly logger = new Logger(RealtimeStreamingExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    private readonly internalService: RealtimeStreamingInternalService,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_STREAMING_CHANNEL', 'telemetry_realtime_stream')
  }

  async broadcastEvent(dto: PublishRealtimeEventDto, tenantId?: string): Promise<boolean> {
    const emitted = this.internalService.publishEvent(dto, tenantId)

    if (emitted) {
      try {
        const payload = JSON.stringify({
          event: dto.event,
          tenantId: dto.tenantId ?? tenantId,
          vehicleId: dto.vehicleId,
          data: dto.data,
          timestamp: new Date().toISOString(),
        })
        await this.redis.publish(this.channel, payload)
        this.logger.log(
          `Broadcasted realtime event to Redis: ${dto.event} (vehicle: ${dto.vehicleId})`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`Failed to broadcast realtime event to Redis: ${message}`)
      }
    }

    return emitted
  }
}

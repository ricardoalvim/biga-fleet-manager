import { Injectable, Inject } from '@nestjs/common'
import { Redis } from 'ioredis'
import { TelemetryIngestionDto } from './telemetry-ingestion.dto'

@Injectable()
export class TelemetryPublisherService {
    constructor(
        @Inject('REDIS_PUBLISHER_CLIENT') private readonly redisClient: Redis
    ) { }

    async publishLocation(payload: TelemetryIngestionDto): Promise<void> {
        const message = JSON.stringify({
            ...payload,
            receivedAt: new Date().toISOString()
        })

        await this.redisClient.publish('biga_telemetry_stream', message)
    }
}
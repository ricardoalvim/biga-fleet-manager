import { Module } from '@nestjs/common'
import { TelemetryGatewayController } from './telemetry-gateway.controller'
import { TelemetryPublisherService } from './telemetry-publisher.service'
import { RedisModule } from 'src/shared/infrastructure/redis/redis.module'

@Module({
  imports: [RedisModule],
  controllers: [TelemetryGatewayController],
  providers: [TelemetryPublisherService],
})
export class GatewayModule {}

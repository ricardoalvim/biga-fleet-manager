import { Module } from '@nestjs/common'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { RedisModule } from '../redis/redis.module.js'
import { RealtimeStreamingController } from './controllers/realtime-streaming.controller.js'
import { RealtimeStreamingInternalService } from './services/realtime-streaming.internal.service.js'
import { RealtimeStreamingExternalService } from './services/realtime-streaming.external.service.js'

@Module({
  imports: [TenancyModule, RedisModule],
  controllers: [RealtimeStreamingController],
  providers: [RealtimeStreamingInternalService, RealtimeStreamingExternalService],
  exports: [RealtimeStreamingInternalService, RealtimeStreamingExternalService],
})
export class RealtimeStreamingModule {}

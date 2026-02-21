import { Module } from '@nestjs/common'
import { TelemetrySubscriberService } from './telemetry-subscriber.service'

@Module({
  providers: [TelemetrySubscriberService],
})
export class TelemetryModule {}

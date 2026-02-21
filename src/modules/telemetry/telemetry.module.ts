import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema'
import { TelemetrySubscriberService } from './telemetry-subscriber.service'
import { TripModule } from '../trip/trip.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
    TripModule,
  ],
  providers: [TelemetrySubscriberService],
})
export class TelemetryModule {}

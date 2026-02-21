import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';
import { TelemetrySubscriberService } from './telemetry-subscriber.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
  ],
  providers: [TelemetrySubscriberService],
})
export class TelemetryModule { }
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FleetModule } from '../fleet/fleet.module.js'
import { TelemetryProcessorService } from './telemetry-processor.service.js'
import { Telemetry, TelemetrySchema } from './telemetry.document.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
    FleetModule,
  ],
  providers: [TelemetryProcessorService],
})
export class TelemetryModule {}

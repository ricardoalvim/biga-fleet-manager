import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FleetService } from './fleet.service'
import { FleetOverviewService } from './fleet-overview.service'
import { FleetController } from './fleet.controller'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { Telemetry, TelemetrySchema } from '../telemetry/schemas/telemetry.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }])
  ],
  controllers: [FleetController],
  providers: [
    FleetService,
    FleetOverviewService,
    PrismaService
  ],
  exports: [FleetService]
})
export class FleetModule { }
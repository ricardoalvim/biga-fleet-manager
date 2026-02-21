import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TripService } from './trip.service'
import { TripController } from './trip.controller'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { Telemetry, TelemetrySchema } from '../telemetry/schemas/telemetry.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }])],
  controllers: [TripController],
  providers: [TripService, PrismaService],
  exports: [TripService],
})
export class TripModule {}

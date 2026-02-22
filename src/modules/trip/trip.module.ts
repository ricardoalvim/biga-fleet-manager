import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HttpModule } from '@nestjs/axios'
import { TripService } from './trip.service'
import { TripController } from './trip.controller'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { Telemetry, TelemetrySchema } from '../telemetry/schemas/telemetry.schema'
import { GeocodingService } from '../../shared/utils/geocoding.service'

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }])
  ],
  controllers: [TripController],
  providers: [TripService, PrismaService, GeocodingService],
  exports: [TripService]
})
export class TripModule { }
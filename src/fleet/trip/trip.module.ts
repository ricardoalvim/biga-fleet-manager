import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GeoModule } from '../../platform/geo/geo.module.js'
import { Telemetry, TelemetrySchema } from '../../telemetry/telemetry.document.js'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { VehicleModule } from '../vehicle/vehicle.module.js'
import { TripController } from './controllers/trip.controller.js'
import { TripRepository } from './repositories/trip.repository.js'
import { TripExternalService } from './services/trip.external.service.js'
import { TripInternalService } from './services/trip.internal.service.js'
import { TripService } from './trip.service.js'

@Module({
  imports: [
    TenancyModule,
    GeoModule,
    VehicleModule,
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
  ],
  controllers: [TripController],
  providers: [TripRepository, TripInternalService, TripExternalService, TripService],
  exports: [TripRepository, TripInternalService, TripExternalService, TripService],
})
export class TripModule {}

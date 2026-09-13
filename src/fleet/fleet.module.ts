import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GeoModule } from '../platform/geo/geo.module.js'
import { Telemetry, TelemetrySchema } from '../telemetry/telemetry.document.js'
import { TenancyModule } from '../tenancy/tenancy.module.js'
import { CompanyController } from './company/company.controller.js'
import { CompanyService } from './company/company.service.js'
import { FuelModule } from './fuel/fuel.module.js'
import { IncidentTollModule } from './incident-toll/incident-toll.module.js'
import { MaintenanceModule } from './maintenance/maintenance.module.js'
import { FleetOverviewController } from './overview/fleet-overview.controller.js'
import { FleetOverviewService } from './overview/fleet-overview.service.js'
import { RoutePlanningModule } from './route-planning/route-planning.module.js'
import { TripModule } from './trip/trip.module.js'
import { VehicleModule } from './vehicle/vehicle.module.js'

@Module({
  imports: [
    TenancyModule,
    GeoModule,
    VehicleModule,
    TripModule,
    MaintenanceModule,
    IncidentTollModule,
    RoutePlanningModule,
    FuelModule,
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
  ],
  controllers: [CompanyController, FleetOverviewController],
  providers: [CompanyService, FleetOverviewService],
  exports: [
    TripModule,
    VehicleModule,
    MaintenanceModule,
    IncidentTollModule,
    RoutePlanningModule,
    FuelModule,
  ],
})
export class FleetModule {}

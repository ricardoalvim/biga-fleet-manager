import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { GeoModule } from '../../platform/geo/geo.module.js'
import { VehicleModule } from '../vehicle/vehicle.module.js'
import { RoutePlanningController } from './controllers/route-planning.controller.js'
import { RoutePlanningRepository } from './repositories/route-planning.repository.js'
import { RouteProfileDocument, RouteProfileSchema } from './schemas/route-profile.document.js'
import { PlannedRouteDocument, PlannedRouteSchema } from './schemas/planned-route.document.js'
import { RoutePlanningExternalService } from './services/route-planning.external.service.js'
import { RoutePlanningInternalService } from './services/route-planning.internal.service.js'

@Module({
  imports: [
    TenancyModule,
    GeoModule,
    VehicleModule,
    MongooseModule.forFeature([
      { name: RouteProfileDocument.name, schema: RouteProfileSchema },
      { name: PlannedRouteDocument.name, schema: PlannedRouteSchema },
    ]),
  ],
  controllers: [RoutePlanningController],
  providers: [RoutePlanningRepository, RoutePlanningInternalService, RoutePlanningExternalService],
  exports: [RoutePlanningRepository, RoutePlanningInternalService, RoutePlanningExternalService],
})
export class RoutePlanningModule {}

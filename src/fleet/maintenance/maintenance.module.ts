import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { VehicleModule } from '../vehicle/vehicle.module.js'
import { MaintenanceController } from './controllers/maintenance.controller.js'
import { MaintenanceRepository } from './repositories/maintenance.repository.js'
import {
  MaintenancePlanDocument,
  MaintenancePlanSchema,
} from './schemas/maintenance-plan.document.js'
import {
  MaintenanceOrderDocument,
  MaintenanceOrderSchema,
} from './schemas/maintenance-order.document.js'
import { MaintenanceExternalService } from './services/maintenance.external.service.js'
import { MaintenanceInternalService } from './services/maintenance.internal.service.js'

@Module({
  imports: [
    TenancyModule,
    VehicleModule,
    MongooseModule.forFeature([
      { name: MaintenancePlanDocument.name, schema: MaintenancePlanSchema },
      { name: MaintenanceOrderDocument.name, schema: MaintenanceOrderSchema },
    ]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceRepository, MaintenanceInternalService, MaintenanceExternalService],
  exports: [MaintenanceRepository, MaintenanceInternalService, MaintenanceExternalService],
})
export class MaintenanceModule {}

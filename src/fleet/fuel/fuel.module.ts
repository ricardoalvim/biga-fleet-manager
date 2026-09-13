import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { VehicleModule } from '../vehicle/vehicle.module.js'
import { MaintenanceModule } from '../maintenance/maintenance.module.js'
import { Telemetry, TelemetrySchema } from '../../telemetry/telemetry.document.js'
import {
  FuelAuditRecordModel,
  FuelAuditRecordSchema,
} from './schemas/fuel-audit-record.document.js'
import { FuelRepository } from './repositories/fuel.repository.js'
import { FuelInternalService } from './services/fuel.internal.service.js'
import { FuelExternalService } from './services/fuel.external.service.js'
import { FuelController } from './controllers/fuel.controller.js'

@Module({
  imports: [
    TenancyModule,
    VehicleModule,
    MaintenanceModule,
    MongooseModule.forFeature([
      { name: FuelAuditRecordModel.name, schema: FuelAuditRecordSchema },
      { name: Telemetry.name, schema: TelemetrySchema },
    ]),
  ],
  controllers: [FuelController],
  providers: [FuelRepository, FuelInternalService, FuelExternalService],
  exports: [FuelRepository, FuelInternalService, FuelExternalService],
})
export class FuelModule {}


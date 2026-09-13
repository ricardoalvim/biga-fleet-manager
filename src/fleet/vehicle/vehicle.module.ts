import { Module } from '@nestjs/common'
import { PrismaModule } from '../../platform/persistence/prisma.module.js'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { VehicleController } from './controllers/vehicle.controller.js'
import { VehicleRepository } from './repositories/vehicle.repository.js'
import { VehicleExternalService } from './services/vehicle.external.service.js'
import { VehicleInternalService } from './services/vehicle.internal.service.js'

@Module({
  imports: [TenancyModule, PrismaModule],
  controllers: [VehicleController],
  providers: [VehicleRepository, VehicleInternalService, VehicleExternalService],
  exports: [VehicleRepository, VehicleInternalService, VehicleExternalService],
})
export class VehicleModule {}

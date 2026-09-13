import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { VehicleModule } from '../vehicle/vehicle.module.js'
import { IncidentTollController } from './controllers/incident-toll.controller.js'
import { IncidentTollRepository } from './repositories/incident-toll.repository.js'
import { TollEventDocument, TollEventSchema } from './schemas/toll-event.document.js'
import { IncidentDocument, IncidentSchema } from './schemas/incident.document.js'
import { IncidentTollExternalService } from './services/incident-toll.external.service.js'
import { IncidentTollInternalService } from './services/incident-toll.internal.service.js'

@Module({
  imports: [
    TenancyModule,
    VehicleModule,
    MongooseModule.forFeature([
      { name: TollEventDocument.name, schema: TollEventSchema },
      { name: IncidentDocument.name, schema: IncidentSchema },
    ]),
  ],
  controllers: [IncidentTollController],
  providers: [IncidentTollRepository, IncidentTollInternalService, IncidentTollExternalService],
  exports: [IncidentTollRepository, IncidentTollInternalService, IncidentTollExternalService],
})
export class IncidentTollModule {}

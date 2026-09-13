import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { PlatformEcosystemModule } from '../ecosystem/platform-ecosystem.module.js'
import { PortalController } from './controllers/portal.controller.js'
import { PortalRepository } from './repositories/portal.repository.js'
import { PortalRoleDocument, PortalRoleSchema } from './schemas/portal-role.document.js'
import {
  PortalOnboardingDocument,
  PortalOnboardingSchema,
} from './schemas/portal-onboarding.document.js'
import { PortalTicketDocument, PortalTicketSchema } from './schemas/portal-ticket.document.js'
import { PortalExternalService } from './services/portal.external.service.js'
import { PortalInternalService } from './services/portal.internal.service.js'

@Module({
  imports: [
    TenancyModule,
    PlatformEcosystemModule,
    MongooseModule.forFeature([
      { name: PortalRoleDocument.name, schema: PortalRoleSchema },
      { name: PortalOnboardingDocument.name, schema: PortalOnboardingSchema },
      { name: PortalTicketDocument.name, schema: PortalTicketSchema },
    ]),
  ],
  controllers: [PortalController],
  providers: [PortalRepository, PortalInternalService, PortalExternalService],
  exports: [PortalRepository, PortalInternalService, PortalExternalService],
})
export class PortalModule {}

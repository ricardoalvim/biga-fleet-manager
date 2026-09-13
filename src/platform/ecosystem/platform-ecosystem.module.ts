import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HttpModule } from '@nestjs/axios'
import { TenancyModule } from '../../tenancy/tenancy.module.js'
import { PlatformEcosystemController } from './controllers/platform-ecosystem.controller.js'
import { PlatformEcosystemRepository } from './repositories/platform-ecosystem.repository.js'
import {
  WebhookSubscriptionDocument,
  WebhookSubscriptionSchema,
} from './schemas/webhook-subscription.document.js'
import {
  TenantCustomizationDocument,
  TenantCustomizationSchema,
} from './schemas/tenant-customization.document.js'
import { PlatformEcosystemExternalService } from './services/platform-ecosystem.external.service.js'
import { PlatformEcosystemInternalService } from './services/platform-ecosystem.internal.service.js'

@Module({
  imports: [
    TenancyModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: WebhookSubscriptionDocument.name, schema: WebhookSubscriptionSchema },
      { name: TenantCustomizationDocument.name, schema: TenantCustomizationSchema },
    ]),
  ],
  controllers: [PlatformEcosystemController],
  providers: [
    PlatformEcosystemRepository,
    PlatformEcosystemInternalService,
    PlatformEcosystemExternalService,
  ],
  exports: [
    PlatformEcosystemRepository,
    PlatformEcosystemInternalService,
    PlatformEcosystemExternalService,
  ],
})
export class PlatformEcosystemModule {}

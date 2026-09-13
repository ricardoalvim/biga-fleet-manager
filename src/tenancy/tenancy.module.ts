import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TenantController } from './tenant.controller.js'
import { TenantContext } from './tenant.context.js'
import { TenantMiddleware } from './tenant.middleware.js'
import { TenantService } from './tenant.service.js'

@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantContext, TenantMiddleware],
  exports: [TenantService, TenantContext],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes(
        'companies',
        'api/v1/companies',
        'vehicles',
        'api/v1/vehicles',
        'trips',
        'api/v1/trips',
        'fleet',
        'api/v1/fleet',
        'fuel',
        'api/v1/fuel',
      )
  }
}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FleetModule } from './fleet/fleet.module.js'
import { IngestionModule } from './ingestion/ingestion.module.js'
import { envSchema } from './platform/config/env.schema.js'
import { HealthModule } from './platform/health/health.module.js'
import { MongoModule } from './platform/mongo/mongo.module.js'
import { PrismaModule } from './platform/persistence/prisma.module.js'
import { RedisModule } from './platform/redis/redis.module.js'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggingInterceptor } from './platform/observability/interceptors/logging.interceptor.js'
import { ObservabilityModule } from './platform/observability/observability.module.js'
import { PlatformEcosystemModule } from './platform/ecosystem/platform-ecosystem.module.js'
import { PortalModule } from './platform/portal/portal.module.js'
import { RealtimeStreamingModule } from './platform/streaming/realtime-streaming.module.js'
import { TelemetryModule } from './telemetry/telemetry.module.js'
import { TenancyModule } from './tenancy/tenancy.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    PrismaModule,
    RedisModule,
    MongoModule,
    TenancyModule,
    FleetModule,
    IngestionModule,
    TelemetryModule,
    HealthModule,
    ObservabilityModule,
    PlatformEcosystemModule,
    PortalModule,
    RealtimeStreamingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisModule } from './shared/infrastructure/redis/redis.module'
import { GatewayModule } from './modules/gateway/gateway.module'
import { TelemetryModule } from './modules/telemetry/telemetry.module'
import { FleetModule } from './modules/fleet/fleet.module'
import { MaintenanceModule } from './modules/maintenance/maintenance.module'
import { CompanyModule } from './modules/company/company.module'
import { TripModule } from './modules/trip/trip.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    GatewayModule,
    TelemetryModule,
    FleetModule,
    MaintenanceModule,
    CompanyModule,
    TripModule
  ],
})
export class AppModule { }

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config' // <-- ADICIONA O ConfigService AQUI
import { RedisModule } from './shared/infrastructure/redis/redis.module'
import { GatewayModule } from './modules/gateway/gateway.module'
import { TelemetryModule } from './modules/telemetry/telemetry.module'
import { FleetModule } from './modules/fleet/fleet.module'
import { MaintenanceModule } from './modules/maintenance/maintenance.module'
import { CompanyModule } from './modules/company/company.module'
import { TripModule } from './modules/trip/trip.module'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
      }),
    }),
    RedisModule,
    GatewayModule,
    TelemetryModule,
    FleetModule,
    MaintenanceModule,
    CompanyModule,
    TripModule,
  ],
})
export class AppModule {}

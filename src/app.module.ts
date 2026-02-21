import { Module } from '@nestjs/common'
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [RedisModule, GatewayModule, TelemetryModule, FleetModule, MaintenanceModule],
  controllers: [],
  providers: [],
})
export class AppModule { }

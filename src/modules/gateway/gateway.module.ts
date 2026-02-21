import { Module } from '@nestjs/common'
import { TelemetryGatewayController } from './telemetry-gateway.controller'
import { TelemetryPublisherService } from './telemetry-publisher.service'

@Module({
    controllers: [TelemetryGatewayController],
    providers: [TelemetryPublisherService]
})
export class GatewayModule { }
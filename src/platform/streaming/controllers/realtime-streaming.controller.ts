import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Sse,
  type MessageEvent,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Observable } from 'rxjs'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import {
  publishRealtimeEventSchema,
  type PublishRealtimeEventDto,
} from '../dtos/external/publish-realtime-event.dto.js'
import { RealtimeStreamingInternalService } from '../services/realtime-streaming.internal.service.js'

@ApiTags('Realtime & Telemetry Streaming')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento estrito do stream SSE de telemetria',
})
@Controller('api/v1/stream')
export class RealtimeStreamingController {
  constructor(
    private readonly internalService: RealtimeStreamingInternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Sse('telemetry')
  @ApiOperation({
    summary:
      'Abre stream Server-Sent Events (SSE) para recepção em tempo real de telemetria, rotas e alertas da frota',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    description: 'UUID do tenant para assinatura (fallback se não enviado no header)',
  })
  @ApiResponse({
    status: 200,
    description: 'Fluxo contínuo text/event-stream filtrado por tenant com eventos da frota',
  })
  streamTelemetry(
    @Query('tenantId') queryTenantId?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Observable<MessageEvent> {
    let tenantId = queryTenantId ?? headerTenantId
    if (!tenantId) {
      try {
        tenantId = this.tenantContext.tenantId
      } catch {
        tenantId = undefined
      }
    }
    return this.internalService.getTenantStream(tenantId)
  }

  @Post('events/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Publica ou injeta evento de streaming no barramento de tempo real aplicando throttling por ativo',
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmação de recebimento (emitted: true se despachado, false se throttled)',
  })
  publishEvent(
    @Body({ schema: publishRealtimeEventSchema }) body: PublishRealtimeEventDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = body.tenantId ?? headerTenantId
    const emitted = tenantId
      ? this.internalService.publishEvent(body, tenantId)
      : this.internalService.publishEvent(body)
    return {
      emitted,
      event: body.event,
      vehicleId: body.vehicleId,
      timestamp: new Date().toISOString(),
    }
  }
}

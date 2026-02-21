import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { GatewayService } from './gateway.service'
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto'

@ApiTags('Telemetry Gateway')
@Controller('telemetry')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Recebe dados brutos dos sensores da Biga' })
  @ApiResponse({
    status: 202,
    description: 'Telemetria aceita e enviada para a fila de processamento.',
  })
  @ApiBody({ type: IngestTelemetryDto })
  async ingest(@Body() dto: IngestTelemetryDto) {
    return this.gatewayService.ingest(dto)
  }
}

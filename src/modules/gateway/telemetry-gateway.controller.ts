import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TelemetryPublisherService } from './telemetry-publisher.service'
import { TelemetryIngestionDto } from './telemetry-ingestion.dto'

@ApiTags('Gateway')
@Controller('telemetry')
export class TelemetryGatewayController {
  constructor(private readonly publisherService: TelemetryPublisherService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Recebe coordenada de uma Biga e enfileira no fluxo' })
  @ApiResponse({ status: 202, description: 'Coordenada aceita para processamento' })
  async ingestData(@Body() payload: TelemetryIngestionDto): Promise<void> {
    await this.publisherService.publishLocation(payload)
  }
}

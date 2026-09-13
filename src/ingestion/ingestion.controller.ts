import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ingestTelemetrySchema,
  type IngestTelemetryInput,
} from './schemas/ingest-telemetry.schema.js'
import { IngestionPublisher } from './ingestion.publisher.js'

@ApiTags('IoT Ingestion')
@Controller('telemetry')
export class IngestionController {
  constructor(private readonly publisher: IngestionPublisher) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Aceita envelope IoT agnóstico e publica no barramento' })
  async ingest(@Body({ schema: ingestTelemetrySchema }) body: IngestTelemetryInput) {
    await this.publisher.publish(body)
    return { accepted: true }
  }
}

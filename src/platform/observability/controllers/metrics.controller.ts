import { Controller, Get, Header } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MetricsService } from '../services/metrics.service.js'

@ApiTags('DevOps & Observability')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary:
      'Endpoint de métricas de telemetria, latência HTTP e consumo de memória no formato padrão Prometheus',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas em formato Prometheus exposition text',
  })
  getMetrics(): string {
    return this.metricsService.getPrometheusMetrics()
  }
}

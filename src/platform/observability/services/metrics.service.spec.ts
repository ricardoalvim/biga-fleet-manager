import { beforeEach, describe, expect, it } from 'vitest'
import { MetricsService } from './metrics.service.js'

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(() => {
    service = new MetricsService()
  })

  it('deve registrar requisições HTTP e gerar contadores no padrão Prometheus', () => {
    service.recordHttpRequest('GET', '/api/v1/vehicles', 200, 0.045)
    service.recordHttpRequest('GET', '/api/v1/vehicles', 200, 0.05)
    service.recordHttpRequest('POST', '/api/v1/vehicles', 201, 0.12)

    const output = service.getPrometheusMetrics()

    expect(output).toContain(
      'http_requests_total{method="GET",route="/api/v1/vehicles",status="200"} 2',
    )
    expect(output).toContain(
      'http_requests_total{method="POST",route="/api/v1/vehicles",status="201"} 1',
    )
  })

  it('deve calcular percentis de latência (p50, p95, p99)', () => {
    // 10 requisições com durações controladas
    for (let i = 1; i <= 10; i++) {
      service.recordHttpRequest('GET', '/api/v1/trips', 200, i * 0.01)
    }

    const output = service.getPrometheusMetrics()

    expect(output).toContain(
      'http_request_duration_seconds{method="GET",route="/api/v1/trips",quantile="0.5"}',
    )
    expect(output).toContain(
      'http_request_duration_seconds{method="GET",route="/api/v1/trips",quantile="0.95"}',
    )
    expect(output).toContain(
      'http_request_duration_seconds{method="GET",route="/api/v1/trips",quantile="0.99"}',
    )
  })

  it('deve registrar contagem de pacotes de telemetria por protocolo IoT', () => {
    service.recordTelemetryIngested('SUNTECH', 10)
    service.recordTelemetryIngested('TELTONIKA', 5)

    const output = service.getPrometheusMetrics()

    expect(output).toContain('telemetry_packets_ingested_total{protocol="SUNTECH"} 10')
    expect(output).toContain('telemetry_packets_ingested_total{protocol="TELTONIKA"} 5')
  })

  it('deve gerenciar conexões SSE ativas com incremento e decremento', () => {
    service.incrementActiveSseConnections()
    service.incrementActiveSseConnections()
    expect(service.getActiveSseConnections()).toBe(2)

    service.decrementActiveSseConnections()
    expect(service.getActiveSseConnections()).toBe(1)

    const output = service.getPrometheusMetrics()
    expect(output).toContain('active_sse_connections_gauge 1')
  })

  it('deve expor métricas de memória do processo Node.js', () => {
    const output = service.getPrometheusMetrics()

    expect(output).toContain('nodejs_heap_used_bytes')
    expect(output).toContain('nodejs_heap_total_bytes')
    expect(output).toContain('nodejs_rss_bytes')
  })
})

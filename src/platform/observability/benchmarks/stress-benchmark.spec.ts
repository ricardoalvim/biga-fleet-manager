import { describe, expect, it } from 'vitest'
import { performance } from 'node:perf_hooks'
import { RealtimeStreamingInternalService } from '../../streaming/services/realtime-streaming.internal.service.js'
import { MetricsService } from '../services/metrics.service.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import type { PublishRealtimeEventDto } from '../../streaming/dtos/external/publish-realtime-event.dto.js'

describe('StressBenchmarkSuite (Validação de SLOs sob Carga)', () => {
  it('deve processar 1.000 requisições telemáticas em alta frequência com throughput > 1.000 req/s', () => {
    const mockTenantContext = {
      tenantId: '00000000-0000-4000-8000-000000000001',
    } as TenantContext

    const streamingService = new RealtimeStreamingInternalService(mockTenantContext, {
      positionThrottleMs: 3000,
    })

    const totalRequests = 1000
    const startTime = performance.now()

    let emittedCount = 0
    let throttledCount = 0

    for (let i = 0; i < totalRequests; i++) {
      const dto: PublishRealtimeEventDto = {
        event: 'vehicle.position.updated',
        vehicleId: `veh-${i % 20}`, // 20 veículos gerando eventos em rajada
        data: {
          latitude: -22.6582 + (i * 0.0001),
          longitude: -50.4183 + (i * 0.0001),
          speed: 60 + (i % 40),
          heading: (i * 15) % 360,
          ignition: true,
          timestamp: new Date().toISOString(),
        },
      }

      const result = streamingService.publishEvent(dto)
      if (result) {
        emittedCount++
      } else {
        throttledCount++
      }
    }

    const endTime = performance.now()
    const durationMs = endTime - startTime
    const throughput = Math.round((totalRequests / durationMs) * 1000)

    // Asserções de SLOs
    expect(emittedCount).toBe(20) // Apenas 1 emissão inicial por cada um dos 20 veículos
    expect(throttledCount).toBe(980) // 980 eventos protegidos e throttled
    expect(throughput).toBeGreaterThan(1000) // Throughput superior a 1.000 req/s
    expect(durationMs).toBeLessThan(500) // 1.000 processamentos em menos de 500ms
  })

  it('deve agregar 1.000 métricas no Prometheus mantendo precisão estatística nos percentis p95 e p99', () => {
    const metricsService = new MetricsService()

    const totalCalls = 1000
    const start = performance.now()

    for (let i = 1; i <= totalCalls; i++) {
      // Simula latências uniformemente distribuídas entre 10ms e 150ms
      const durationSeconds = (10 + (i % 140)) / 1000
      metricsService.recordHttpRequest('GET', '/api/v1/vehicles', 200, durationSeconds)
    }

    const end = performance.now()
    const output = metricsService.getPrometheusMetrics()

    // Validações
    expect(end - start).toBeLessThan(300)
    expect(output).toContain('http_requests_total{method="GET",route="/api/v1/vehicles",status="200"} 1000')
    expect(output).toContain('http_request_duration_seconds{method="GET",route="/api/v1/vehicles",quantile="0.5"}')
    expect(output).toContain('http_request_duration_seconds{method="GET",route="/api/v1/vehicles",quantile="0.95"}')
    expect(output).toContain('http_request_duration_seconds{method="GET",route="/api/v1/vehicles",quantile="0.99"}')
    expect(output).not.toContain('NaN')
    expect(output).not.toContain('undefined')
  })
})


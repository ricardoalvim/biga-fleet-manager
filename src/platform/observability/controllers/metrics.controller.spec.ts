import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MetricsController } from './metrics.controller.js'
import type { MetricsService } from '../services/metrics.service.js'

describe('MetricsController', () => {
  let controller: MetricsController
  let mockMetricsService: Partial<MetricsService>

  beforeEach(() => {
    mockMetricsService = {
      getPrometheusMetrics: vi
        .fn()
        .mockReturnValue('# HELP http_requests_total\nhttp_requests_total 10\n'),
    }

    controller = new MetricsController(mockMetricsService as MetricsService)
  })

  it('deve retornar a saída de métricas do serviço no padrão Prometheus', () => {
    const result = controller.getMetrics()

    expect(mockMetricsService.getPrometheusMetrics).toHaveBeenCalled()
    expect(result).toContain('http_requests_total 10')
  })
})

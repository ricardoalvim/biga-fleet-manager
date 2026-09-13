import { describe, expect, it, vi, beforeEach } from 'vitest'
import { HealthController } from './health.controller.js'
import type {
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus'

describe('HealthController', () => {
  let controller: HealthController
  let mockHealth: Partial<HealthCheckService>
  let mockMongo: Partial<MongooseHealthIndicator>
  let mockMemory: Partial<MemoryHealthIndicator>

  beforeEach(() => {
    mockHealth = {
      check: vi.fn().mockImplementation((indicators: any[]) => {
        return Promise.all(indicators.map((ind) => ind())).then((results) => ({
          status: 'ok',
          info: Object.assign({}, ...results),
          error: {},
          details: Object.assign({}, ...results),
        }))
      }),
    }

    mockMongo = {
      pingCheck: vi.fn().mockResolvedValue({ mongodb: { status: 'up' } }),
    }

    mockMemory = {
      checkHeap: vi.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
    }

    controller = new HealthController(
      mockHealth as HealthCheckService,
      mockMongo as MongooseHealthIndicator,
      mockMemory as MemoryHealthIndicator,
    )
  })

  it('deve executar o health check agregando os indicadores de saúde', async () => {
    const result = await controller.check()

    expect(result.status).toBe('ok')
    expect(mockHealth.check).toHaveBeenCalled()
    expect(mockMongo.pingCheck).toHaveBeenCalledWith('mongodb')
    expect(mockMemory.checkHeap).toHaveBeenCalledWith('memory_heap', 150 * 1024 * 1024)
    expect(result.info.fleet).toEqual({
      status: 'up',
      message: 'Fleet manager is alive',
    })
  })
})

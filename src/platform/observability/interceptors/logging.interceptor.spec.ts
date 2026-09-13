import { beforeEach, describe, expect, it, vi } from 'vitest'
import { of, throwError } from 'rxjs'
import { LoggingInterceptor } from './logging.interceptor.js'
import type { MetricsService } from '../services/metrics.service.js'
import type { ExecutionContext, CallHandler } from '@nestjs/common'

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor
  let mockMetricsService: Partial<MetricsService>

  beforeEach(() => {
    mockMetricsService = {
      recordHttpRequest: vi.fn(),
    }
    interceptor = new LoggingInterceptor(mockMetricsService as MetricsService)
  })

  it('deve registrar métricas e injetar x-trace-id na resposta com sucesso', async () => {
    const setHeaderMock = vi.fn()
    const context: Partial<ExecutionContext> = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'GET',
          originalUrl: '/api/v1/vehicles/11111111-2222-3333-4444-555555555555',
          headers: { 'x-tenant-id': 'tenant-test' },
        }),
        getResponse: vi.fn().mockReturnValue({
          statusCode: 200,
          setHeader: setHeaderMock,
        }),
      }),
    }

    const next: CallHandler = {
      handle: vi.fn().mockReturnValue(of({ success: true })),
    }

    const obs = interceptor.intercept(context as ExecutionContext, next)

    await new Promise<void>((resolve) => {
      obs.subscribe({
        complete: () => {
          expect(setHeaderMock).toHaveBeenCalledWith('x-trace-id', expect.any(String))
          expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/v1/vehicles/:id',
            200,
            expect.any(Number),
          )
          resolve()
        },
      })
    })
  })

  it('deve registrar erro e métrica com status correto em caso de falha', async () => {
    const context: Partial<ExecutionContext> = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'POST',
          originalUrl: '/api/v1/trips',
          headers: {},
        }),
        getResponse: vi.fn().mockReturnValue({
          statusCode: 400,
          setHeader: vi.fn(),
        }),
      }),
    }

    const next: CallHandler = {
      handle: vi.fn().mockReturnValue(throwError(() => ({ status: 404, message: 'Not found' }))),
    }

    const obs = interceptor.intercept(context as ExecutionContext, next)

    await new Promise<void>((resolve) => {
      obs.subscribe({
        error: () => {
          expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            'POST',
            '/api/v1/trips',
            404,
            expect.any(Number),
          )
          resolve()
        },
      })
    })
  })
})

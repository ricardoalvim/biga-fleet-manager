import { beforeEach, describe, expect, it, vi } from 'vitest'
import { of } from 'rxjs'
import { RealtimeStreamingController } from './realtime-streaming.controller.js'
import type { RealtimeStreamingInternalService } from '../services/realtime-streaming.internal.service.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'

describe('RealtimeStreamingController', () => {
  let controller: RealtimeStreamingController
  let internalService: Partial<RealtimeStreamingInternalService>
  let mockTenantContext: Partial<TenantContext>

  beforeEach(() => {
    mockTenantContext = {
      tenantId: '00000000-0000-4000-8000-000000000001',
    }

    internalService = {
      getTenantStream: vi.fn().mockReturnValue(of({ type: 'vehicle.position.updated', data: {} })),
      publishEvent: vi.fn().mockReturnValue(true),
    }

    controller = new RealtimeStreamingController(
      internalService as RealtimeStreamingInternalService,
      mockTenantContext as TenantContext,
    )
  })

  it('deve delegar chamada de abertura de stream SSE usando tenant do contexto', () => {
    const obs = controller.streamTelemetry()
    expect(internalService.getTenantStream).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
    )
    expect(obs).toBeDefined()
  })

  it('deve permitir sobrescrever tenant via query param', () => {
    controller.streamTelemetry('tenant-custom-99')
    expect(internalService.getTenantStream).toHaveBeenCalledWith('tenant-custom-99')
  })

  it('deve delegar publicação de evento e retornar status de emissão', () => {
    const dto = {
      event: 'vehicle.position.updated' as const,
      vehicleId: 'veh-001',
      data: { latitude: -22.0, longitude: -50.0 },
    }

    const res = controller.publishEvent(dto)
    expect(internalService.publishEvent).toHaveBeenCalledWith(dto)
    expect(res).toEqual(
      expect.objectContaining({
        emitted: true,
        event: 'vehicle.position.updated',
        vehicleId: 'veh-001',
      }),
    )
  })
})

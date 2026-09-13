import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RealtimeStreamingExternalService } from './realtime-streaming.external.service.js'
import type { RealtimeStreamingInternalService } from './realtime-streaming.internal.service.js'
import type { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'

describe('RealtimeStreamingExternalService', () => {
  let service: RealtimeStreamingExternalService
  let mockRedis: Partial<Redis>
  let mockInternalService: Partial<RealtimeStreamingInternalService>
  let mockConfig: Partial<ConfigService>

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockInternalService = {
      publishEvent: vi.fn().mockReturnValue(true),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('telemetry_realtime_stream'),
    }

    service = new RealtimeStreamingExternalService(
      mockRedis as Redis,
      mockInternalService as RealtimeStreamingInternalService,
      mockConfig as ConfigService,
    )
  })

  it('deve repassar evento para o serviço interno e publicar no Redis', async () => {
    const dto = {
      event: 'vehicle.position.updated' as const,
      vehicleId: 'veh-1',
      data: { latitude: -22.0, longitude: -50.0 },
    }

    const emitted = await service.broadcastEvent(dto, 'tenant-1')

    expect(emitted).toBe(true)
    expect(mockInternalService.publishEvent).toHaveBeenCalledWith(dto, 'tenant-1')
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'telemetry_realtime_stream',
      expect.stringContaining('vehicle.position.updated'),
    )
  })

  it('não deve publicar no Redis se o evento for throttled pelo serviço interno', async () => {
    mockInternalService.publishEvent = vi.fn().mockReturnValue(false)

    const dto = {
      event: 'vehicle.position.updated' as const,
      vehicleId: 'veh-1',
      data: { latitude: -22.0, longitude: -50.0 },
    }

    const emitted = await service.broadcastEvent(dto, 'tenant-1')

    expect(emitted).toBe(false)
    expect(mockRedis.publish).not.toHaveBeenCalled()
  })

  it('deve lidar com falha do Redis sem estourar exceção não tratada', async () => {
    mockRedis.publish = vi.fn().mockRejectedValue(new Error('Redis timeout'))

    const dto = {
      event: 'geofence.alert' as const,
      vehicleId: 'veh-1',
      data: { action: 'ENTER' },
    }

    const emitted = await service.broadcastEvent(dto, 'tenant-1')
    expect(emitted).toBe(true)
  })
})

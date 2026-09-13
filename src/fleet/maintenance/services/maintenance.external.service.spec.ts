import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import { MaintenanceExternalService } from './maintenance.external.service.js'
import { MaintenanceOrderInternalDto } from '../dtos/internal/maintenance-order.internal.dto.js'

describe('MaintenanceExternalService', () => {
  let service: MaintenanceExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleOrder = new MaintenanceOrderInternalDto({
    id: 'order-100',
    tenantId: 'tenant-100',
    vehicleId: 'veh-100',
    providerId: 'prov-100',
    type: 'CORRECTIVE',
    status: 'COMPLETED',
    scheduledDate: '2026-09-12T08:00:00Z',
    completedAt: '2026-09-12T16:00:00Z',
    downtimeHours: 8,
    downtimeCostPerHour: 50,
    totalPartsCost: 300,
    totalLaborCost: 200,
    totalDowntimeCost: 400,
    totalCost: 900,
    executedItems: [],
    createdAt: '2026-09-12T08:00:00Z',
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('maintenance_events_stream'),
    }

    service = new MaintenanceExternalService(
      mockRedis as unknown as Redis,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve publicar evento MAINTENANCE_ORDER_CREATED no canal configurado', async () => {
    await service.notifyOrderCreated(sampleOrder)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'maintenance_events_stream',
      expect.stringContaining('"event":"MAINTENANCE_ORDER_CREATED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'maintenance_events_stream',
      expect.stringContaining('"orderId":"order-100"'),
    )
  })

  it('deve tolerar falha do Redis ao publicar MAINTENANCE_ORDER_CREATED', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis offline'))

    await expect(service.notifyOrderCreated(sampleOrder)).resolves.not.toThrow()
  })

  it('deve publicar evento MAINTENANCE_ORDER_COMPLETED com custos', async () => {
    await service.notifyOrderCompleted(sampleOrder)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'maintenance_events_stream',
      expect.stringContaining('"event":"MAINTENANCE_ORDER_COMPLETED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'maintenance_events_stream',
      expect.stringContaining('"totalCost":900'),
    )
  })

  it('deve tolerar falha do Redis ao publicar MAINTENANCE_ORDER_COMPLETED', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis timeout'))

    await expect(service.notifyOrderCompleted(sampleOrder)).resolves.not.toThrow()
  })
})

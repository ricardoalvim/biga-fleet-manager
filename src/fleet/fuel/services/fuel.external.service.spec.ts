import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import { FuelExternalService } from './fuel.external.service.js'
import { FuelAuditInternalDto } from '../dtos/internal/fuel-audit.internal.dto.js'

describe('FuelExternalService', () => {
  let service: FuelExternalService
  let redis: Partial<Redis>
  let config: Partial<ConfigService>

  const mockAudit = new FuelAuditInternalDto({
    id: 'audit-001',
    tenantId: '00000000-0000-4000-8000-000000000001',
    vehicleId: 'veh-001',
    plate: 'ABC1234',
    gasStation: {
      name: 'Posto Petrobras',
      latitude: -23.55,
      longitude: -46.63,
    },
    timestamp: '2026-09-13T10:00:00Z',
    fuelType: 'DIESEL_S10',
    liters: 100,
    pricePerLiter: 6.0,
    totalValue: 600.0,
    reportedOdometerKm: 120000,
    status: 'APPROVED',
    fraudRiskScore: 10,
    fraudSignals: [],
    mitigatingFactors: [],
    reconciledAt: '2026-09-13T10:05:00Z',
  })

  beforeEach(() => {
    redis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    config = {
      get: vi.fn().mockReturnValue('test_fuel_channel'),
    }

    service = new FuelExternalService(redis as Redis, config as ConfigService)
  })

  it('deve publicar evento de reconciliação no canal do Redis', async () => {
    await service.broadcastReconciliation(mockAudit)

    expect(redis.publish).toHaveBeenCalledWith(
      'test_fuel_channel',
      expect.stringContaining('FUEL_TRANSACTION_RECONCILED'),
    )
  })

  it('deve publicar alerta de fraude para transação suspeita ou rejeitada', async () => {
    const suspectAudit = new FuelAuditInternalDto({
      ...mockAudit,
      status: 'REJECTED',
      fraudRiskScore: 85,
      fraudSignals: ['SIGNAL_TANK_CAPACITY_EXCEEDED'],
    })

    await service.broadcastFraudAlert(suspectAudit)

    expect(redis.publish).toHaveBeenCalledWith(
      'test_fuel_channel',
      expect.stringContaining('FUEL_FRAUD_ALERT_TRIGGERED'),
    )
  })

  it('não deve quebrar a execução se o Redis falhar', async () => {
    vi.spyOn(redis, 'publish').mockRejectedValueOnce(new Error('Redis connection down'))

    await expect(service.broadcastReconciliation(mockAudit)).resolves.not.toThrow()
  })
})


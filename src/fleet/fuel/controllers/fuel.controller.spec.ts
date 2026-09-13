import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FuelController } from './fuel.controller.js'
import type { FuelInternalService } from '../services/fuel.internal.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { FuelAuditInternalDto } from '../dtos/internal/fuel-audit.internal.dto.js'

describe('FuelController', () => {
  let controller: FuelController
  let fuelService: Partial<FuelInternalService>
  let tenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const mockAudit = new FuelAuditInternalDto({
    id: 'audit-001',
    tenantId,
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
    fraudRiskScore: 0,
    fraudSignals: [],
    mitigatingFactors: [],
    reconciledAt: '2026-09-13T10:05:00Z',
  })

  beforeEach(() => {
    tenantContext = {
      tenantId,
    }

    fuelService = {
      reconcileTransaction: vi.fn().mockResolvedValue(mockAudit),
      reconcileBatch: vi.fn().mockResolvedValue([mockAudit]),
      ingestLegacyFile: vi.fn().mockResolvedValue([mockAudit]),
      listAudits: vi.fn().mockResolvedValue([mockAudit]),
      findAuditById: vi.fn().mockResolvedValue(mockAudit),
      getMetrics: vi.fn().mockResolvedValue({
        tenantId,
        totalReconciled: 1,
        approvedCount: 1,
        suspectCount: 0,
        rejectedCount: 0,
        totalAmountSpent: 600,
        totalLitersSupplied: 100,
        totalSuspectAmount: 0,
        commonFraudSignals: [],
      }),
    }

    controller = new FuelController(
      fuelService as FuelInternalService,
      tenantContext as TenantContext,
    )
  })

  it('deve delegar reconciliação unitária para o serviço interno', async () => {
    const res = await controller.reconcile({
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
    })

    expect(fuelService.reconcileTransaction).toHaveBeenCalled()
    expect(res).toBe(mockAudit)
  })

  it('deve delegar reconciliação em lote', async () => {
    const res = await controller.reconcileBatch({
      operator: 'TICKET_LOG',
      transactions: [
        {
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
        },
      ],
    })

    expect(fuelService.reconcileBatch).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('deve delegar ingestão de arquivo legado', async () => {
    const res = await controller.ingestLegacyFile({
      operator: 'TICKET_LOG',
      content: 'ABC1234;2026-09-13T10:00:00Z;Posto A;-23.55;-46.63;DIESEL_S10;100;6.0;600;120000',
    })

    expect(fuelService.ingestLegacyFile).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('deve listar auditorias e retornar detalhes por ID', async () => {
    const list = await controller.listAudits('ABC1234')
    expect(fuelService.listAudits).toHaveBeenCalledWith(tenantId, {
      plate: 'ABC1234',
      vehicleId: undefined,
      status: undefined,
      minScore: undefined,
    })
    expect(list).toHaveLength(1)

    const detail = await controller.getAuditById('audit-001')
    expect(fuelService.findAuditById).toHaveBeenCalledWith(tenantId, 'audit-001')
    expect(detail).toBe(mockAudit)
  })

  it('deve retornar métricas de combustível', async () => {
    const metrics = await controller.getMetrics()
    expect(fuelService.getMetrics).toHaveBeenCalledWith(tenantId)
    expect(metrics.totalReconciled).toBe(1)
  })
})


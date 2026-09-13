import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import type { Model } from 'mongoose'
import { FuelInternalService } from './fuel.internal.service.js'
import type { FuelRepository } from '../repositories/fuel.repository.js'
import type { FuelExternalService } from './fuel.external.service.js'
import type { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import type { MaintenanceRepository } from '../../maintenance/repositories/maintenance.repository.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import type { Telemetry } from '../../../telemetry/telemetry.document.js'
import { FuelAuditInternalDto } from '../dtos/internal/fuel-audit.internal.dto.js'

describe('FuelInternalService', () => {
  let service: FuelInternalService
  let fuelRepo: Partial<FuelRepository>
  let fuelExternal: Partial<FuelExternalService>
  let vehicleRepo: Partial<VehicleRepository>
  let maintenanceRepo: Partial<MaintenanceRepository>
  let tenantContext: Partial<TenantContext>
  let telemetryModel: Partial<Model<Telemetry>>

  const tenantId = '00000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    tenantContext = {
      tenantId,
    }

    vehicleRepo = {
      findByPlate: vi.fn().mockResolvedValue({
        id: 'veh-001',
        tenantId,
        plate: 'ABC1234',
        model: 'Volvo FH 540 Truck',
      }),
    }

    fuelRepo = {
      create: vi.fn().mockImplementation(async (entity) => {
        return new FuelAuditInternalDto({
          id: 'audit-mock-id',
          tenantId: entity.tenantId,
          vehicleId: entity.vehicleId,
          driverId: entity.driverId,
          plate: entity.plate,
          gasStation: entity.gasStation,
          timestamp: entity.timestamp.toISOString(),
          fuelType: entity.fuelType,
          liters: entity.liters,
          pricePerLiter: entity.pricePerLiter,
          totalValue: entity.totalValue,
          reportedOdometerKm: entity.reportedOdometerKm,
          status: entity.status,
          fraudRiskScore: entity.fraudRiskScore,
          fraudSignals: entity.fraudSignals,
          mitigatingFactors: entity.mitigatingFactors,
          reconciledAt: entity.reconciledAt.toISOString(),
          notes: entity.notes,
        })
      }),
      findAudits: vi.fn().mockResolvedValue([]),
      findAuditById: vi.fn().mockResolvedValue(null),
      getMetrics: vi.fn().mockResolvedValue({
        tenantId,
        totalReconciled: 10,
        approvedCount: 8,
        suspectCount: 1,
        rejectedCount: 1,
        totalAmountSpent: 5000,
        totalLitersSupplied: 800,
        totalSuspectAmount: 850,
        commonFraudSignals: [{ signal: 'SIGNAL_TANK_CAPACITY_EXCEEDED', count: 1 }],
      }),
    }

    fuelExternal = {
      broadcastReconciliation: vi.fn().mockResolvedValue(undefined),
      broadcastFraudAlert: vi.fn().mockResolvedValue(undefined),
    }

    maintenanceRepo = {
      findOrders: vi.fn().mockResolvedValue([]),
    }

    telemetryModel = {
      findOne: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            latitude: -23.5505,
            longitude: -46.6333,
            timestamp: new Date('2026-09-13T10:00:00Z'),
          }),
        }),
      }),
    } as unknown as Model<Telemetry>

    service = new FuelInternalService(
      fuelRepo as FuelRepository,
      fuelExternal as FuelExternalService,
      vehicleRepo as VehicleRepository,
      maintenanceRepo as MaintenanceRepository,
      tenantContext as TenantContext,
      telemetryModel as Model<Telemetry>,
    )
  })

  it('deve aprovar abastecimento legítimo quando todas as variáveis estão normais', async () => {
    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-001',
      plate: 'ABC1234',
      gasStation: {
        name: 'Posto Petrobras',
        latitude: -23.5505,
        longitude: -46.6333,
      },
      timestamp: '2026-09-13T10:05:00Z',
      fuelType: 'DIESEL_S10',
      liters: 150, // Menor que o tanque de 450L
      pricePerLiter: 6.2,
      totalValue: 930.0,
      reportedOdometerKm: 120500,
    })

    expect(res.status).toBe('APPROVED')
    expect(res.fraudRiskScore).toBe(0)
    expect(res.fraudSignals).toHaveLength(0)
    expect(fuelExternal.broadcastReconciliation).toHaveBeenCalled()
    expect(fuelExternal.broadcastFraudAlert).not.toHaveBeenCalled()
  })

  it('deve rejeitar transação quando a litragem excede a capacidade física do tanque', async () => {
    // Veículo leve com tanque de 55L
    vi.spyOn(vehicleRepo, 'findByPlate').mockResolvedValueOnce({
      id: 'veh-002',
      tenantId,
      plate: 'MOBI001',
      model: 'Fiat Mobi',
    } as any)

    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-002',
      plate: 'MOBI001',
      gasStation: {
        name: 'Posto Cidade',
        latitude: -23.5505,
        longitude: -46.6333,
      },
      timestamp: '2026-09-13T10:00:00Z',
      fuelType: 'GASOLINE',
      liters: 85, // 85L > 55L * 1.05
      pricePerLiter: 5.8,
      totalValue: 493.0,
      reportedOdometerKm: 34000,
    })

    expect(res.status).toBe('SUSPECT')
    expect(res.fraudSignals).toContain('SIGNAL_TANK_CAPACITY_EXCEEDED')
    expect(fuelExternal.broadcastFraudAlert).toHaveBeenCalled()
  })

  it('deve identificar fraude de localização quando o veículo estava longe do posto no mesmo horário', async () => {
    // Posto no Rio de Janeiro enquanto telemetria registrou em São Paulo minutos antes
    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-001',
      plate: 'ABC1234',
      gasStation: {
        name: 'Posto Rio de Janeiro',
        latitude: -22.9068,
        longitude: -43.1729,
      },
      timestamp: '2026-09-13T10:10:00Z', // Apenas 10 min de diferença
      fuelType: 'DIESEL_S10',
      liters: 200,
      pricePerLiter: 6.2,
      totalValue: 1240.0,
      reportedOdometerKm: 120500,
    })

    expect(res.status).toBe('SUSPECT')
    expect(res.fraudSignals).toContain('SIGNAL_LOCATION_MISMATCH')
  })

  it('deve aplicar fator atenuante de sombra de GPS para veículos sem sinal há mais de 30 minutos', async () => {
    // Última telemetria há 90 minutos
    vi.spyOn(telemetryModel, 'findOne').mockReturnValueOnce({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          latitude: -23.5505,
          longitude: -46.6333,
          timestamp: new Date('2026-09-13T08:00:00Z'), // 2 horas antes
        }),
      }),
    } as any)

    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-001',
      plate: 'ABC1234',
      gasStation: {
        name: 'Posto Serra do Mar',
        latitude: -23.60,
        longitude: -46.70,
      },
      timestamp: '2026-09-13T10:00:00Z',
      fuelType: 'DIESEL_S10',
      liters: 100,
      pricePerLiter: 6.2,
      totalValue: 620.0,
      reportedOdometerKm: 120500,
    })

    expect(res.mitigatingFactors).toContain('GPS_SHADOW_OR_DELAY_BUFFER')
    expect(res.fraudSignals).toContain('SIGNAL_POTENTIAL_LOCATION_MISMATCH')
    expect(res.status).toBe('APPROVED') // Risco baixo (15 pontos) é aprovado
  })

  it('deve aplicar fator atenuante quando o veículo está com Ordem de Serviço ativa em oficina', async () => {
    vi.spyOn(maintenanceRepo, 'findOrders').mockResolvedValueOnce([
      { id: 'os-active-1', status: 'IN_PROGRESS' } as any,
    ])

    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-001',
      plate: 'ABC1234',
      gasStation: {
        name: 'Posto Perto da Oficina',
        latitude: -23.58,
        longitude: -46.68,
      },
      timestamp: '2026-09-13T10:10:00Z',
      fuelType: 'DIESEL_S10',
      liters: 100,
      pricePerLiter: 6.2,
      totalValue: 620.0,
      reportedOdometerKm: 120500,
    })

    expect(res.mitigatingFactors).toContain('WORKSHOP_GEO_FENCE_OR_ACTIVE_OS')
  })

  it('deve sinalizar anomalia de odômetro quando a quilometragem informada regride', async () => {
    vi.spyOn(fuelRepo, 'findAudits').mockResolvedValueOnce([
      { reportedOdometerKm: 150000 } as any,
    ])

    const res = await service.reconcileTransaction({
      tenantId,
      vehicleId: 'veh-001',
      plate: 'ABC1234',
      gasStation: {
        name: 'Posto Petrobras',
        latitude: -23.5505,
        longitude: -46.6333,
      },
      timestamp: '2026-09-13T10:00:00Z',
      fuelType: 'DIESEL_S10',
      liters: 100,
      pricePerLiter: 6.2,
      totalValue: 620.0,
      reportedOdometerKm: 148000, // Menor que 150.000
    })

    expect(res.fraudSignals).toContain('SIGNAL_ODOMETER_REGRESSION')
    expect(res.status).toBe('SUSPECT')
  })

  it('deve reconciliar arquivo CSV legado e processar lote com sucesso', async () => {
    const csvContent = `PLACA;DATA;POSTO;LAT;LON;COMBUSTIVEL;LITROS;PRECO_LITRO;VALOR_TOTAL;ODOMETRO
ABC1234;2026-09-13T10:00:00Z;Posto A;-23.5505;-46.6333;DIESEL_S10;100;6.2;620;120000`

    const res = await service.ingestLegacyFile(csvContent, tenantId)

    expect(res).toHaveLength(1)
    expect(res[0].plate).toBe('ABC1234')
  })

  it('deve lançar NotFoundException ao buscar auditoria inexistente', async () => {
    vi.spyOn(fuelRepo, 'findAuditById').mockResolvedValueOnce(null)

    await expect(service.findAuditById(tenantId, 'non-existent')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('deve retornar métricas consolidadas de combustível e fraude', async () => {
    const metrics = await service.getMetrics(tenantId)

    expect(metrics.totalReconciled).toBe(10)
    expect(metrics.approvedCount).toBe(8)
    expect(metrics.commonFraudSignals).toBeDefined()
  })
})


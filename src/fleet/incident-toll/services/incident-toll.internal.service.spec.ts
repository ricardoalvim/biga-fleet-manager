import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { IncidentTollInternalService } from './incident-toll.internal.service.js'
import type { IncidentTollRepository } from '../repositories/incident-toll.repository.js'
import type { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import type { PrismaService } from '../../../platform/persistence/prisma.service.js'
import type { IncidentTollExternalService } from './incident-toll.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { TollEventInternalDto } from '../dtos/internal/toll-event.internal.dto.js'
import { IncidentInternalDto } from '../dtos/internal/incident.internal.dto.js'
import { VehicleInternalDto } from '../../vehicle/dtos/internal/vehicle.internal.dto.js'

describe('IncidentTollInternalService', () => {
  let service: IncidentTollInternalService
  let mockRepository: {
    createTollEvent: ReturnType<typeof vi.fn>
    findTollByExternalId: ReturnType<typeof vi.fn>
    findTolls: ReturnType<typeof vi.fn>
    createIncident: ReturnType<typeof vi.fn>
    findIncidentById: ReturnType<typeof vi.fn>
    findIncidents: ReturnType<typeof vi.fn>
    settleIncident: ReturnType<typeof vi.fn>
    getVehicleTollsSum: ReturnType<typeof vi.fn>
    getVehicleIncidentsSum: ReturnType<typeof vi.fn>
  }
  let mockVehicleRepo: {
    findById: ReturnType<typeof vi.fn>
  }
  let mockPrisma: {
    orm: {
      Company: {
        where: ReturnType<typeof vi.fn>
      }
    }
  }
  let mockExternalService: {
    notifyTollEvent: ReturnType<typeof vi.fn>
    notifyIncident: ReturnType<typeof vi.fn>
    notifyIncidentSettled: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const vehicleId = 'veh-001'
  const companyId = 'comp-001'

  const sampleVehicle = new VehicleInternalDto({
    id: vehicleId,
    tenantId,
    plate: 'ROM1001',
    model: 'Mercedes Sprinter',
    ownerId: 'own-1',
    contractorId: 'cont-1',
    custodianId: 'cust-1',
    createdAt: '2026-01-01T00:00:00Z',
  })

  const sampleToll = new TollEventInternalDto({
    id: 'toll-1',
    tenantId,
    vehicleId,
    tollPlazaName: 'Rodovias do Tietê - Praça 04',
    externalTransactionId: 'TAG-99887766',
    amount: 14.8,
    passedAt: '2026-09-12T20:15:00Z',
    createdAt: '2026-09-12T20:15:00Z',
  })

  const sampleIncident = new IncidentInternalDto({
    id: 'inc-1',
    tenantId,
    vehicleId,
    responsibleCompanyId: companyId,
    incidentType: 'ACCIDENT',
    description: 'Colisão traseira leve',
    estimatedCost: 3500,
    actualCost: null,
    status: 'OPEN',
    occurredAt: '2026-09-12T14:30:00Z',
    settledAt: null,
    createdAt: '2026-09-12T14:30:00Z',
  })

  beforeEach(() => {
    mockTenantContext = { tenantId }

    mockRepository = {
      createTollEvent: vi.fn(),
      findTollByExternalId: vi.fn(),
      findTolls: vi.fn(),
      createIncident: vi.fn(),
      findIncidentById: vi.fn(),
      findIncidents: vi.fn(),
      settleIncident: vi.fn(),
      getVehicleTollsSum: vi.fn(),
      getVehicleIncidentsSum: vi.fn(),
    }

    mockVehicleRepo = {
      findById: vi.fn(),
    }

    mockPrisma = {
      orm: {
        Company: {
          where: vi.fn(),
        },
      },
    }

    mockExternalService = {
      notifyTollEvent: vi.fn().mockResolvedValue(undefined),
      notifyIncident: vi.fn().mockResolvedValue(undefined),
      notifyIncidentSettled: vi.fn().mockResolvedValue(undefined),
    }

    service = new IncidentTollInternalService(
      mockRepository as unknown as IncidentTollRepository,
      mockVehicleRepo as unknown as VehicleRepository,
      mockPrisma as unknown as PrismaService,
      mockExternalService as unknown as IncidentTollExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('Pedágios (Tolls)', () => {
    it('deve registrar passagem em pedágio com sucesso e emitir evento', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findTollByExternalId.mockResolvedValue(null)
      mockRepository.createTollEvent.mockResolvedValue(sampleToll)

      const result = await service.registerTollEvent({
        vehicleId,
        tollPlazaName: 'Rodovias do Tietê - Praça 04',
        externalTransactionId: 'TAG-99887766',
        amount: 14.8,
        passedAt: '2026-09-12T20:15:00Z',
      })

      expect(result).toEqual(sampleToll)
      expect(mockExternalService.notifyTollEvent).toHaveBeenCalledWith(sampleToll)
    })

    it('deve rejeitar pedágio se o veículo não existir no tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(
        service.registerTollEvent({
          vehicleId: 'veh-missing',
          tollPlazaName: 'Praça 04',
          externalTransactionId: 'TAG-99887766',
          amount: 14.8,
          passedAt: '2026-09-12T20:15:00Z',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve rejeitar transação de pedágio duplicada para o mesmo tenant (idempotência)', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findTollByExternalId.mockResolvedValue(sampleToll)

      await expect(
        service.registerTollEvent({
          vehicleId,
          tollPlazaName: 'Rodovias do Tietê - Praça 04',
          externalTransactionId: 'TAG-99887766',
          amount: 14.8,
          passedAt: '2026-09-12T20:15:00Z',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('deve listar passagens em pedágios', async () => {
      mockRepository.findTolls.mockResolvedValue([sampleToll])

      const result = await service.findTolls({ vehicleId })

      expect(result).toHaveLength(1)
      expect(mockRepository.findTolls).toHaveBeenCalledWith(tenantId, { vehicleId })
    })
  })

  describe('Sinistros e Ocorrências (Incidents)', () => {
    it('deve registrar sinistro com sucesso quando veículo e empresa responsável existem', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Company.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: companyId, name: 'Transportes Rápidos' }),
      })
      mockRepository.createIncident.mockResolvedValue(sampleIncident)

      const result = await service.registerIncident({
        vehicleId,
        responsibleCompanyId: companyId,
        incidentType: 'ACCIDENT',
        description: 'Colisão traseira leve',
        estimatedCost: 3500,
        occurredAt: '2026-09-12T14:30:00Z',
      })

      expect(result).toEqual(sampleIncident)
      expect(mockExternalService.notifyIncident).toHaveBeenCalledWith(sampleIncident)
    })

    it('deve rejeitar sinistro se o veículo não existir no tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(
        service.registerIncident({
          vehicleId: 'veh-unknown',
          responsibleCompanyId: companyId,
          incidentType: 'ACCIDENT',
          description: 'Avaria',
          estimatedCost: 1000,
          occurredAt: '2026-09-12T14:30:00Z',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve rejeitar sinistro se a empresa responsável não pertencer ao tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Company.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      })

      await expect(
        service.registerIncident({
          vehicleId,
          responsibleCompanyId: 'comp-unknown',
          incidentType: 'ACCIDENT',
          description: 'Avaria',
          estimatedCost: 1000,
          occurredAt: '2026-09-12T14:30:00Z',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve liquidar sinistro com sucesso atualizando actualCost e status', async () => {
      mockRepository.findIncidentById.mockResolvedValue(sampleIncident)

      const settledIncident = new IncidentInternalDto({
        ...sampleIncident,
        actualCost: 3200,
        status: 'SETTLED',
        settledAt: '2026-09-12T18:00:00Z',
      })
      mockRepository.settleIncident.mockResolvedValue(settledIncident)

      const result = await service.settleIncident('inc-1', {
        actualCost: 3200,
      })

      expect(result.status).toBe('SETTLED')
      expect(result.actualCost).toBe(3200)
      expect(mockExternalService.notifyIncidentSettled).toHaveBeenCalledWith(settledIncident)
    })

    it('deve lançar ConflictException ao tentar liquidar sinistro já liquidado', async () => {
      const alreadySettled = new IncidentInternalDto({
        ...sampleIncident,
        status: 'SETTLED',
        actualCost: 3200,
      })
      mockRepository.findIncidentById.mockResolvedValue(alreadySettled)

      await expect(service.settleIncident('inc-1', { actualCost: 3000 })).rejects.toThrow(
        ConflictException,
      )
    })

    it('deve lançar NotFoundException ao buscar ou liquidar sinistro inexistente', async () => {
      mockRepository.findIncidentById.mockResolvedValue(null)

      await expect(service.findIncidentById('missing')).rejects.toThrow(NotFoundException)
      await expect(service.settleIncident('missing', { actualCost: 100 })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('Resumo Financeiro para TCO', () => {
    it('deve calcular o resumo financeiro consolidando pedágios e sinistros do veículo', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.getVehicleTollsSum.mockResolvedValue({
        totalAmount: 148.5,
        count: 10,
      })
      mockRepository.getVehicleIncidentsSum.mockResolvedValue({
        totalEstimated: 3500,
        totalActual: 3200,
        count: 2,
      })

      const summary = await service.getVehicleFinancialSummary(vehicleId)

      expect(summary.vehicleId).toBe(vehicleId)
      expect(summary.vehiclePlate).toBe('ROM1001')
      expect(summary.totalTollAmount).toBe(148.5)
      expect(summary.tollPassageCount).toBe(10)
      expect(summary.totalActualIncidentCost).toBe(3200)
      expect(summary.incidentCount).toBe(2)
      expect(summary.totalCombinedCost).toBe(3348.5) // 148.5 + 3200
    })

    it('deve lançar NotFoundException no resumo se o veículo não existir', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(service.getVehicleFinancialSummary('unknown')).rejects.toThrow(NotFoundException)
    })
  })
})

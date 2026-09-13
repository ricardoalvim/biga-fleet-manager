import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { MaintenanceInternalService } from './maintenance.internal.service.js'
import type { MaintenanceRepository } from '../repositories/maintenance.repository.js'
import type { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import type { PrismaService } from '../../../platform/persistence/prisma.service.js'
import type { MaintenanceExternalService } from './maintenance.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import {
  MaintenancePlanInternalDto,
  MaintenancePlanItemDto,
} from '../dtos/internal/maintenance-plan.internal.dto.js'
import {
  MaintenanceOrderInternalDto,
  MaintenanceOrderItemDto,
} from '../dtos/internal/maintenance-order.internal.dto.js'
import { VehicleInternalDto } from '../../vehicle/dtos/internal/vehicle.internal.dto.js'

describe('MaintenanceInternalService', () => {
  let service: MaintenanceInternalService
  let mockRepository: {
    createPlan: ReturnType<typeof vi.fn>
    findPlans: ReturnType<typeof vi.fn>
    findPlanById: ReturnType<typeof vi.fn>
    createOrder: ReturnType<typeof vi.fn>
    findOrderById: ReturnType<typeof vi.fn>
    findOrders: ReturnType<typeof vi.fn>
    completeOrder: ReturnType<typeof vi.fn>
  }
  let mockVehicleRepo: {
    findById: ReturnType<typeof vi.fn>
  }
  let mockPrisma: {
    orm: {
      Company: {
        where: ReturnType<typeof vi.fn>
      }
      Trip: {
        where: ReturnType<typeof vi.fn>
      }
    }
  }
  let mockExternalService: {
    notifyOrderCreated: ReturnType<typeof vi.fn>
    notifyOrderCompleted: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const vehicleId = 'veh-001'
  const providerId = 'prov-001'

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

  const samplePlan = new MaintenancePlanInternalDto({
    id: 'plan-1',
    tenantId,
    name: 'Revisão 10.000 km',
    triggerKm: 10000,
    items: [
      new MaintenancePlanItemDto({
        description: 'Troca de Óleo',
        action: 'REPLACEMENT',
      }),
      new MaintenancePlanItemDto({
        description: 'Inspeção de Freios',
        action: 'INSPECTION',
      }),
    ],
    createdAt: '2026-01-01T00:00:00Z',
  })

  const sampleOrder = new MaintenanceOrderInternalDto({
    id: 'order-1',
    tenantId,
    vehicleId,
    providerId,
    type: 'PREVENTIVE',
    status: 'OPEN',
    scheduledDate: '2026-09-20T08:00:00Z',
    completedAt: null,
    downtimeHours: 0,
    downtimeCostPerHour: 0,
    totalPartsCost: 0,
    totalLaborCost: 0,
    totalDowntimeCost: 0,
    totalCost: 0,
    executedItems: [],
    createdAt: '2026-09-12T08:00:00Z',
  })

  beforeEach(() => {
    mockTenantContext = { tenantId }

    mockRepository = {
      createPlan: vi.fn(),
      findPlans: vi.fn(),
      findPlanById: vi.fn(),
      createOrder: vi.fn(),
      findOrderById: vi.fn(),
      findOrders: vi.fn(),
      completeOrder: vi.fn(),
    }

    mockVehicleRepo = {
      findById: vi.fn(),
    }

    mockPrisma = {
      orm: {
        Company: {
          where: vi.fn(),
        },
        Trip: {
          where: vi.fn(),
        },
      },
    }

    mockExternalService = {
      notifyOrderCreated: vi.fn().mockResolvedValue(undefined),
      notifyOrderCompleted: vi.fn().mockResolvedValue(undefined),
    }

    service = new MaintenanceInternalService(
      mockRepository as unknown as MaintenanceRepository,
      mockVehicleRepo as unknown as VehicleRepository,
      mockPrisma as unknown as PrismaService,
      mockExternalService as unknown as MaintenanceExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('Planos de Manutenção', () => {
    it('deve cadastrar um plano de manutenção com checklist com sucesso', async () => {
      mockRepository.createPlan.mockResolvedValue(samplePlan)

      const result = await service.createPlan({
        name: 'Revisão 10.000 km',
        triggerKm: 10000,
        items: [
          { description: 'Troca de Óleo', action: 'REPLACEMENT' },
          { description: 'Inspeção de Freios', action: 'INSPECTION' },
        ],
      })

      expect(result).toEqual(samplePlan)
      expect(mockRepository.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          name: 'Revisão 10.000 km',
          triggerKm: 10000,
        }),
      )
    })

    it('deve listar planos de manutenção do tenant', async () => {
      mockRepository.findPlans.mockResolvedValue([samplePlan])

      const result = await service.findPlans()

      expect(result).toHaveLength(1)
      expect(mockRepository.findPlans).toHaveBeenCalledWith(tenantId)
    })
  })

  describe('Abertura de O.S. (createOrder)', () => {
    it('deve abrir ordem de serviço com sucesso quando veículo e prestador MAINTENANCE existem', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Company.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({
          id: providerId,
          type: 'MAINTENANCE',
          name: 'Oficina Central',
        }),
      })
      mockRepository.createOrder.mockResolvedValue(sampleOrder)

      const result = await service.createOrder({
        vehicleId,
        providerId,
        type: 'PREVENTIVE',
        scheduledDate: '2026-09-20T08:00:00Z',
      })

      expect(result).toEqual(sampleOrder)
      expect(mockExternalService.notifyOrderCreated).toHaveBeenCalledWith(sampleOrder)
    })

    it('deve lançar NotFoundException se o veículo não existir no tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(
        service.createOrder({
          vehicleId: 'veh-missing',
          providerId,
          type: 'CORRECTIVE',
          scheduledDate: '2026-09-20T08:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar NotFoundException se o prestador não existir no tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Company.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      })

      await expect(
        service.createOrder({
          vehicleId,
          providerId: 'prov-missing',
          type: 'CORRECTIVE',
          scheduledDate: '2026-09-20T08:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar BadRequestException se a empresa prestadora não for do tipo MAINTENANCE', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Company.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({
          id: providerId,
          type: 'CLIENT',
          name: 'Cliente Final',
        }),
      })

      await expect(
        service.createOrder({
          vehicleId,
          providerId,
          type: 'CORRECTIVE',
          scheduledDate: '2026-09-20T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('Conclusão de O.S. (completeOrder)', () => {
    it('deve concluir ordem calculando custos de peças, mão de obra e indisponibilidade', async () => {
      mockRepository.findOrderById.mockResolvedValue(sampleOrder)

      const completedOrder = new MaintenanceOrderInternalDto({
        ...sampleOrder,
        status: 'COMPLETED',
        completedAt: '2026-09-20T18:00:00Z',
        downtimeHours: 10,
        downtimeCostPerHour: 50,
        totalPartsCost: 250,
        totalLaborCost: 150,
        totalDowntimeCost: 500,
        totalCost: 900,
        executedItems: [
          new MaintenanceOrderItemDto({
            description: 'Troca de Óleo',
            action: 'REPLACEMENT',
            partCost: 250,
            laborCost: 100,
          }),
          new MaintenanceOrderItemDto({
            description: 'Inspeção de Pastilhas',
            action: 'INSPECTION',
            partCost: 0,
            laborCost: 50,
          }),
        ],
      })

      mockRepository.completeOrder.mockResolvedValue(completedOrder)

      const result = await service.completeOrder('order-1', {
        downtimeHours: 10,
        downtimeCostPerHour: 50,
        executedItems: [
          { description: 'Troca de Óleo', action: 'REPLACEMENT', partCost: 250, laborCost: 100 },
          {
            description: 'Inspeção de Pastilhas',
            action: 'INSPECTION',
            partCost: 0,
            laborCost: 50,
          },
        ],
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.totalPartsCost).toBe(250)
      expect(result.totalLaborCost).toBe(150)
      expect(result.totalDowntimeCost).toBe(500)
      expect(result.totalCost).toBe(900)
      expect(mockExternalService.notifyOrderCompleted).toHaveBeenCalledWith(completedOrder)
    })

    it('deve lançar NotFoundException se a ordem não existir', async () => {
      mockRepository.findOrderById.mockResolvedValue(null)

      await expect(
        service.completeOrder('order-missing', {
          downtimeHours: 5,
          downtimeCostPerHour: 50,
          executedItems: [
            { description: 'Ajuste', action: 'INSPECTION', partCost: 0, laborCost: 100 },
          ],
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar ConflictException se a ordem já estiver concluída', async () => {
      const alreadyCompleted = new MaintenanceOrderInternalDto({
        ...sampleOrder,
        status: 'COMPLETED',
      })
      mockRepository.findOrderById.mockResolvedValue(alreadyCompleted)

      await expect(
        service.completeOrder('order-1', {
          downtimeHours: 5,
          downtimeCostPerHour: 50,
          executedItems: [
            { description: 'Ajuste', action: 'INSPECTION', partCost: 0, laborCost: 100 },
          ],
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('Consultas e Sugestões Preditivas', () => {
    it('deve buscar ordem por ID com sucesso', async () => {
      mockRepository.findOrderById.mockResolvedValue(sampleOrder)

      const result = await service.findOrderById('order-1')

      expect(result.id).toBe('order-1')
    })

    it('deve lançar NotFoundException ao buscar ordem inexistente por ID', async () => {
      mockRepository.findOrderById.mockResolvedValue(null)

      await expect(service.findOrderById('order-missing')).rejects.toThrow(NotFoundException)
    })

    it('deve gerar sugestões preditivas classificando planos em DUE, OVERDUE ou UPCOMING', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findPlans.mockResolvedValue([
        samplePlan, // trigger: 10000 km
        new MaintenancePlanInternalDto({
          id: 'plan-2',
          tenantId,
          name: 'Revisão 20.000 km',
          triggerKm: 20000,
          items: [],
          createdAt: '2026-01-01T00:00:00Z',
        }),
        new MaintenancePlanInternalDto({
          id: 'plan-0',
          tenantId,
          name: 'Revisão 5.000 km',
          triggerKm: 5000,
          items: [],
          createdAt: '2026-01-01T00:00:00Z',
        }),
      ])

      // Com odômetro em 10200 km:
      // plan-0 (5000km): kmDifference = 5200 >= 1000 => OVERDUE
      // samplePlan (10000km): kmDifference = 200 >= 0 e < 1000 => DUE
      // plan-2 (20000km): kmDifference = -9800 < 0 => UPCOMING
      const result = await service.getPredictiveSuggestions(vehicleId, 10200)

      expect(result.vehicleId).toBe(vehicleId)
      expect(result.vehiclePlate).toBe('ROM1001')
      expect(result.currentKm).toBe(10200)
      expect(result.suggestions).toHaveLength(3)

      const plan0 = result.suggestions.find((s) => s.planId === 'plan-0')
      expect(plan0?.status).toBe('OVERDUE')

      const plan1 = result.suggestions.find((s) => s.planId === 'plan-1')
      expect(plan1?.status).toBe('DUE')

      const plan2 = result.suggestions.find((s) => s.planId === 'plan-2')
      expect(plan2?.status).toBe('UPCOMING')
    })

    it('deve calcular quilometragem a partir do histórico de viagens quando não fornecido override', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockPrisma.orm.Trip.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ distanceKm: 4500 }, { distanceKm: 6000 }]),
      })
      mockRepository.findPlans.mockResolvedValue([samplePlan])

      const result = await service.getPredictiveSuggestions(vehicleId)

      expect(result.currentKm).toBe(10500)
      expect(result.suggestions[0].status).toBe('DUE')
    })
  })
})

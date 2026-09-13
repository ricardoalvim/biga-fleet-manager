import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { RoutePlanningInternalService } from './route-planning.internal.service.js'
import type { RoutePlanningRepository } from '../repositories/route-planning.repository.js'
import type { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import type { RoutePlanningExternalService } from './route-planning.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { RouteProfileInternalDto } from '../dtos/internal/route-profile.internal.dto.js'
import { PlannedRouteInternalDto } from '../dtos/internal/planned-route.internal.dto.js'
import { VehicleInternalDto } from '../../vehicle/dtos/internal/vehicle.internal.dto.js'

describe('RoutePlanningInternalService', () => {
  let service: RoutePlanningInternalService
  let mockRepository: {
    createProfile: ReturnType<typeof vi.fn>
    findProfileById: ReturnType<typeof vi.fn>
    findProfiles: ReturnType<typeof vi.fn>
    createPlannedRoute: ReturnType<typeof vi.fn>
    findRouteById: ReturnType<typeof vi.fn>
    findRoutes: ReturnType<typeof vi.fn>
    updateRouteStatus: ReturnType<typeof vi.fn>
  }
  let mockVehicleRepo: {
    findById: ReturnType<typeof vi.fn>
  }
  let mockExternalService: {
    notifyRouteCalculated: ReturnType<typeof vi.fn>
    notifyRouteDispatched: ReturnType<typeof vi.fn>
    resolveAddress: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const vehicleId = 'veh-001'
  const profileId = 'prof-001'

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

  const sampleProfile = new RouteProfileInternalDto({
    id: profileId,
    tenantId,
    name: 'Perfil Safra Agrícola',
    businessContext: 'AGRICULTURAL',
    customTerminology: {
      stopPointLabel: 'Talhão/Fazenda',
      assetLabel: 'Colheitadeira/Trator',
      routeLabel: 'Deslocamento de Campo',
    },
    physicalConstraints: {
      maxWeightTons: 24.5,
      maxHeightMeters: 4.2,
      allowUnpavedRoads: true,
      maxSpeedKmh: 40,
    },
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  const sampleRoute = new PlannedRouteInternalDto({
    id: 'route-001',
    tenantId,
    profileId,
    vehicleId,
    origin: { latitude: -22.6582, longitude: -50.4183 },
    destination: { latitude: -22.71, longitude: -50.5 },
    waypoints: [{ latitude: -22.68, longitude: -50.45, sequence: 1 }],
    distanceKm: 12.8,
    estimatedDurationMinutes: 30.72,
    projectedFuelLiters: 8.32,
    status: 'PLANNED',
    dispatchedAt: null,
    createdAt: '2026-09-12T12:00:00Z',
    updatedAt: '2026-09-12T12:00:00Z',
  })

  beforeEach(() => {
    mockRepository = {
      createProfile: vi.fn(),
      findProfileById: vi.fn(),
      findProfiles: vi.fn(),
      createPlannedRoute: vi.fn(),
      findRouteById: vi.fn(),
      findRoutes: vi.fn(),
      updateRouteStatus: vi.fn(),
    }

    mockVehicleRepo = {
      findById: vi.fn(),
    }

    mockExternalService = {
      notifyRouteCalculated: vi.fn().mockResolvedValue(undefined),
      notifyRouteDispatched: vi.fn().mockResolvedValue(undefined),
      resolveAddress: vi.fn().mockResolvedValue('Endereço Teste'),
    }

    mockTenantContext = {
      tenantId,
    }

    service = new RoutePlanningInternalService(
      mockRepository as unknown as RoutePlanningRepository,
      mockVehicleRepo as unknown as VehicleRepository,
      mockExternalService as unknown as RoutePlanningExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('createProfile', () => {
    it('deve criar um perfil de rota com vocabulário customizado e restrições físicas', async () => {
      mockRepository.createProfile.mockImplementation((dto) => {
        return Promise.resolve(
          new RouteProfileInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            name: dto.name,
            businessContext: dto.businessContext,
            customTerminology: dto.customTerminology,
            physicalConstraints: dto.physicalConstraints,
            createdAt: dto.createdAt.toISOString(),
            updatedAt: dto.updatedAt.toISOString(),
          }),
        )
      })

      const result = await service.createProfile({
        name: 'Perfil Safra Agrícola',
        businessContext: 'AGRICULTURAL',
        customTerminology: {
          stopPointLabel: 'Talhão/Fazenda',
          assetLabel: 'Colheitadeira/Trator',
          routeLabel: 'Deslocamento de Campo',
        },
        physicalConstraints: {
          maxWeightTons: 24.5,
          maxHeightMeters: 4.2,
          allowUnpavedRoads: true,
          maxSpeedKmh: 40,
        },
      })

      expect(result).toBeDefined()
      expect(result.businessContext).toBe('AGRICULTURAL')
      expect(result.customTerminology.stopPointLabel).toBe('Talhão/Fazenda')
      expect(result.physicalConstraints.maxWeightTons).toBe(24.5)
      expect(mockRepository.createProfile).toHaveBeenCalledTimes(1)
    })

    it('deve rejeitar perfil com velocidade máxima menor ou igual a zero', async () => {
      await expect(
        service.createProfile({
          name: 'Perfil Inválido',
          businessContext: 'DELIVERY',
          customTerminology: {
            stopPointLabel: 'Ponto',
            assetLabel: 'Van',
            routeLabel: 'Itinerário',
          },
          physicalConstraints: {
            maxWeightTons: 3.5,
            maxHeightMeters: 2.2,
            allowUnpavedRoads: false,
            maxSpeedKmh: 0,
          },
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve rejeitar perfil com peso negativo', async () => {
      await expect(
        service.createProfile({
          name: 'Perfil Negativo',
          businessContext: 'HEAVY_CARGO',
          customTerminology: {
            stopPointLabel: 'Terminal',
            assetLabel: 'Carreta',
            routeLabel: 'Rota Pesada',
          },
          physicalConstraints: {
            maxWeightTons: -5,
            maxHeightMeters: 4.0,
            allowUnpavedRoads: false,
            maxSpeedKmh: 80,
          },
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('getProfileById', () => {
    it('deve retornar perfil de rota existente', async () => {
      mockRepository.findProfileById.mockResolvedValue(sampleProfile)

      const result = await service.getProfileById(profileId)

      expect(result).toEqual(sampleProfile)
      expect(mockRepository.findProfileById).toHaveBeenCalledWith(tenantId, profileId)
    })

    it('deve lançar NotFoundException (FLEET-0015) se perfil não for encontrado', async () => {
      mockRepository.findProfileById.mockResolvedValue(null)

      await expect(service.getProfileById('inexistente')).rejects.toThrow(NotFoundException)
    })
  })

  describe('calculateRoute', () => {
    it('deve calcular rota conectando origem, waypoints e destino com consumo contextual', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findProfileById.mockResolvedValue(sampleProfile)
      mockRepository.createPlannedRoute.mockImplementation((dto) => {
        return Promise.resolve(
          new PlannedRouteInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            profileId: dto.profileId,
            vehicleId: dto.vehicleId,
            origin: dto.origin,
            destination: dto.destination,
            waypoints: dto.waypoints,
            distanceKm: dto.distanceKm,
            estimatedDurationMinutes: dto.estimatedDurationMinutes,
            projectedFuelLiters: dto.projectedFuelLiters,
            status: dto.status,
            dispatchedAt: null,
            createdAt: dto.createdAt.toISOString(),
            updatedAt: dto.updatedAt.toISOString(),
          }),
        )
      })

      const result = await service.calculateRoute({
        profileId,
        vehicleId,
        origin: { latitude: -22.6582, longitude: -50.4183 },
        destination: { latitude: -22.71, longitude: -50.5 },
        waypoints: [{ latitude: -22.68, longitude: -50.45, sequence: 1 }],
      })

      expect(result).toBeDefined()
      expect(result.distanceKm).toBeGreaterThan(0)
      expect(result.estimatedDurationMinutes).toBeGreaterThan(0)
      expect(result.projectedFuelLiters).toBeGreaterThan(0)
      expect(result.status).toBe('PLANNED')
      expect(result.vehicle?.plate).toBe('ROM1001')
      expect(mockExternalService.notifyRouteCalculated).toHaveBeenCalledTimes(1)
    })

    it('deve lançar NotFoundException (FLEET-0007) se veículo não existir', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(
        service.calculateRoute({
          profileId,
          vehicleId: 'veh-inexistente',
          origin: { latitude: -22.6582, longitude: -50.4183 },
          destination: { latitude: -22.71, longitude: -50.5 },
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar NotFoundException (FLEET-0015) se perfil não existir', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findProfileById.mockResolvedValue(null)

      await expect(
        service.calculateRoute({
          profileId: 'prof-inexistente',
          vehicleId,
          origin: { latitude: -22.6582, longitude: -50.4183 },
          destination: { latitude: -22.71, longitude: -50.5 },
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar BadRequestException se coordenadas forem inválidas', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findProfileById.mockResolvedValue(sampleProfile)

      await expect(
        service.calculateRoute({
          profileId,
          vehicleId,
          origin: { latitude: 95, longitude: -50.4183 }, // Lat inválida (> 90)
          destination: { latitude: -22.71, longitude: -50.5 },
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('dispatchRoute', () => {
    it('deve despachar rota planejada com sucesso e emitir evento', async () => {
      mockRepository.findRouteById.mockResolvedValue(sampleRoute)
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findProfileById.mockResolvedValue(sampleProfile)

      const dispatchedRoute = new PlannedRouteInternalDto({
        ...sampleRoute,
        status: 'DISPATCHED',
        dispatchedAt: '2026-09-12T13:00:00Z',
      })
      mockRepository.updateRouteStatus.mockResolvedValue(dispatchedRoute)

      const result = await service.dispatchRoute('route-001')

      expect(result.status).toBe('DISPATCHED')
      expect(result.dispatchedAt).toBeDefined()
      expect(mockExternalService.notifyRouteDispatched).toHaveBeenCalledTimes(1)
      expect(mockRepository.updateRouteStatus).toHaveBeenCalledWith(
        tenantId,
        'route-001',
        'DISPATCHED',
        expect.any(Date),
      )
    })

    it('deve lançar NotFoundException (FLEET-0016) se rota não existir', async () => {
      mockRepository.findRouteById.mockResolvedValue(null)

      await expect(service.dispatchRoute('inexistente')).rejects.toThrow(NotFoundException)
    })

    it('deve lançar ConflictException (FLEET-0017) se rota já tiver sido despachada', async () => {
      const alreadyDispatched = new PlannedRouteInternalDto({
        ...sampleRoute,
        status: 'DISPATCHED',
        dispatchedAt: '2026-09-12T12:30:00Z',
      })
      mockRepository.findRouteById.mockResolvedValue(alreadyDispatched)

      await expect(service.dispatchRoute('route-001')).rejects.toThrow(ConflictException)
    })
  })

  describe('listRoutes & getRouteById', () => {
    it('deve listar rotas com filtros de veículo', async () => {
      mockRepository.findRoutes.mockResolvedValue([sampleRoute])

      const result = await service.listRoutes(tenantId, { vehicleId })

      expect(result).toHaveLength(1)
      expect(mockRepository.findRoutes).toHaveBeenCalledWith(tenantId, { vehicleId })
    })

    it('deve buscar rota por ID com enriquecimento de veículo e perfil', async () => {
      mockRepository.findRouteById.mockResolvedValue(sampleRoute)
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockRepository.findProfileById.mockResolvedValue(sampleProfile)

      const result = await service.getRouteById('route-001')

      expect(result.id).toBe('route-001')
      expect(result.vehicle?.plate).toBe('ROM1001')
      expect(result.profile?.name).toBe('Perfil Safra Agrícola')
    })
  })
})

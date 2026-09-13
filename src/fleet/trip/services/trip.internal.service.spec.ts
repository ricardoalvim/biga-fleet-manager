import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { TripInternalService } from './trip.internal.service.js'
import type { TripRepository } from '../repositories/trip.repository.js'
import type { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import type { TripExternalService } from './trip.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { TripInternalDto, TripVehicleSummaryDto } from '../dtos/internal/trip.internal.dto.js'
import { VehicleInternalDto } from '../../vehicle/dtos/internal/vehicle.internal.dto.js'

describe('TripInternalService', () => {
  let service: TripInternalService
  let mockTripRepo: {
    create: ReturnType<typeof vi.fn>
    findActiveByVehicle: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    findActiveTrips: ReturnType<typeof vi.fn>
    finishTrip: ReturnType<typeof vi.fn>
    getTelemetryPoints: ReturnType<typeof vi.fn>
  }
  let mockVehicleRepo: {
    findById: ReturnType<typeof vi.fn>
  }
  let mockExternalService: {
    notifyTripStarted: ReturnType<typeof vi.fn>
    notifyTripFinished: ReturnType<typeof vi.fn>
    resolveAddress: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const vehicleId = 'veh-001'

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

  const sampleTrip = new TripInternalDto({
    id: 'trip-100',
    tenantId,
    vehicleId,
    startedAt: '2026-09-12T10:00:00Z',
    endedAt: null,
    distanceKm: 0,
    ignition: true,
    vehicle: new TripVehicleSummaryDto({
      id: vehicleId,
      plate: 'ROM1001',
      model: 'Mercedes Sprinter',
    }),
  })

  beforeEach(() => {
    mockTenantContext = { tenantId }

    mockTripRepo = {
      create: vi.fn(),
      findActiveByVehicle: vi.fn(),
      findById: vi.fn(),
      findActiveTrips: vi.fn(),
      finishTrip: vi.fn(),
      getTelemetryPoints: vi.fn(),
    }

    mockVehicleRepo = {
      findById: vi.fn(),
    }

    mockExternalService = {
      notifyTripStarted: vi.fn().mockResolvedValue(undefined),
      notifyTripFinished: vi.fn().mockResolvedValue(undefined),
      resolveAddress: vi.fn().mockResolvedValue('Praça da Sé, São Paulo, SP'),
    }

    service = new TripInternalService(
      mockTripRepo as unknown as TripRepository,
      mockVehicleRepo as unknown as VehicleRepository,
      mockExternalService as unknown as TripExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('startTrip', () => {
    it('deve criar uma nova viagem se o veículo existir e não houver viagem ativa', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockTripRepo.findActiveByVehicle.mockResolvedValue(null)
      mockTripRepo.create.mockResolvedValue(sampleTrip)

      const result = await service.startTrip(vehicleId)

      expect(result).toEqual(sampleTrip)
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith(tenantId, vehicleId)
      expect(mockTripRepo.findActiveByVehicle).toHaveBeenCalledWith(tenantId, vehicleId)
      expect(mockTripRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, vehicleId }),
      )
      expect(mockExternalService.notifyTripStarted).toHaveBeenCalledWith(sampleTrip)
    })

    it('deve retornar a viagem ativa existente caso já esteja em andamento (idempotência)', async () => {
      mockVehicleRepo.findById.mockResolvedValue(sampleVehicle)
      mockTripRepo.findActiveByVehicle.mockResolvedValue(sampleTrip)

      const result = await service.startTrip(vehicleId)

      expect(result).toEqual(sampleTrip)
      expect(mockTripRepo.create).not.toHaveBeenCalled()
      expect(mockExternalService.notifyTripStarted).not.toHaveBeenCalled()
    })

    it('deve lançar NotFoundException se o veículo não existir no tenant', async () => {
      mockVehicleRepo.findById.mockResolvedValue(null)

      await expect(service.startTrip('non-existent-veh')).rejects.toThrow(NotFoundException)
      expect(mockTripRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('finishTrip', () => {
    it('deve encerrar viagem ativa e calcular distância acumulada via telemetria', async () => {
      mockTripRepo.findById.mockResolvedValue(sampleTrip)

      const telemetryPoints = [
        {
          latitude: -23.55052,
          longitude: -46.633308,
          speed: 40,
          timestamp: new Date('2026-09-12T10:00:00Z'),
        },
        {
          latitude: -23.56052,
          longitude: -46.643308,
          speed: 60,
          timestamp: new Date('2026-09-12T10:05:00Z'),
        },
      ]
      mockTripRepo.getTelemetryPoints.mockResolvedValue(telemetryPoints)

      const finishedTrip = new TripInternalDto({
        ...sampleTrip,
        endedAt: '2026-09-12T10:05:00Z',
        distanceKm: 1.48,
        ignition: false,
      })
      mockTripRepo.finishTrip.mockResolvedValue(finishedTrip)

      const result = await service.finishTrip('trip-100')

      expect(result.endedAt).toBeDefined()
      expect(result.ignition).toBe(false)
      expect(mockTripRepo.finishTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 'trip-100',
          tenantId,
          distanceKm: expect.any(Number),
        }),
      )
      expect(mockExternalService.notifyTripFinished).toHaveBeenCalledWith(finishedTrip)
    })

    it('deve lançar NotFoundException ao tentar finalizar viagem inexistente', async () => {
      mockTripRepo.findById.mockResolvedValue(null)

      await expect(service.finishTrip('trip-unknown')).rejects.toThrow(NotFoundException)
      expect(mockTripRepo.finishTrip).not.toHaveBeenCalled()
    })

    it('deve lançar ConflictException ao tentar finalizar viagem já encerrada anteriormente', async () => {
      const alreadyFinished = new TripInternalDto({
        ...sampleTrip,
        endedAt: '2026-09-12T10:10:00Z',
        ignition: false,
      })
      mockTripRepo.findById.mockResolvedValue(alreadyFinished)

      await expect(service.finishTrip('trip-100')).rejects.toThrow(ConflictException)
      expect(mockTripRepo.finishTrip).not.toHaveBeenCalled()
    })

    it('deve definir distância 0 km se não houver pontos de telemetria suficientes', async () => {
      mockTripRepo.findById.mockResolvedValue(sampleTrip)
      mockTripRepo.getTelemetryPoints.mockResolvedValue([
        { latitude: -23.55, longitude: -46.63, speed: 0, timestamp: new Date() },
      ])

      const finishedWithZero = new TripInternalDto({
        ...sampleTrip,
        endedAt: '2026-09-12T10:01:00Z',
        distanceKm: 0,
        ignition: false,
      })
      mockTripRepo.finishTrip.mockResolvedValue(finishedWithZero)

      const result = await service.finishTrip('trip-100')

      expect(mockTripRepo.finishTrip).toHaveBeenCalledWith(
        expect.objectContaining({ distanceKm: 0 }),
      )
      expect(result.distanceKm).toBe(0)
    })
  })

  describe('findActiveTrips e findById', () => {
    it('deve listar viagens ativas do tenant', async () => {
      mockTripRepo.findActiveTrips.mockResolvedValue([sampleTrip])

      const result = await service.findActiveTrips()

      expect(result).toHaveLength(1)
      expect(mockTripRepo.findActiveTrips).toHaveBeenCalledWith(tenantId)
    })

    it('deve buscar viagem por ID com sucesso', async () => {
      mockTripRepo.findById.mockResolvedValue(sampleTrip)

      const result = await service.findById('trip-100')

      expect(result.id).toBe('trip-100')
    })

    it('deve lançar NotFoundException ao buscar por ID inexistente', async () => {
      mockTripRepo.findById.mockResolvedValue(null)

      await expect(service.findById('trip-non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getTripReport', () => {
    it('deve gerar relatório com rota enriquecida, endereços e velocidade média', async () => {
      mockTripRepo.findById.mockResolvedValue(sampleTrip)
      mockTripRepo.getTelemetryPoints.mockResolvedValue([
        {
          latitude: -23.5505,
          longitude: -46.6333,
          speed: 40,
          timestamp: new Date('2026-09-12T10:00:00Z'),
        },
        {
          latitude: -23.5605,
          longitude: -46.6433,
          speed: 60,
          timestamp: new Date('2026-09-12T10:05:00Z'),
        },
      ])

      const report = await service.getTripReport('trip-100')

      expect(report.id).toBe('trip-100')
      expect(report.vehiclePlate).toBe('ROM1001')
      expect(report.stats.avgSpeed).toBe(50)
      expect(report.stats.pointCount).toBe(2)
      expect(report.route).toHaveLength(2)
      expect(mockExternalService.resolveAddress).toHaveBeenCalledTimes(2)
    })

    it('deve lançar NotFoundException ao gerar relatório de viagem inexistente', async () => {
      mockTripRepo.findById.mockResolvedValue(null)

      await expect(service.getTripReport('trip-missing')).rejects.toThrow(NotFoundException)
    })
  })
})

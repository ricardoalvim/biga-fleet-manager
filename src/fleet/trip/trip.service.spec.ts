import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TripService } from './trip.service.js'
import type { TripInternalService } from './services/trip.internal.service.js'

describe('TripService (Bridge)', () => {
  let service: TripService
  let mockInternalService: {
    findActiveByVehicle: ReturnType<typeof vi.fn>
    startTrip: ReturnType<typeof vi.fn>
    finishTrip: ReturnType<typeof vi.fn>
    getTripReport: ReturnType<typeof vi.fn>
    findActiveTrips: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockInternalService = {
      findActiveByVehicle: vi.fn(),
      startTrip: vi.fn(),
      finishTrip: vi.fn(),
      getTripReport: vi.fn(),
      findActiveTrips: vi.fn(),
      findById: vi.fn(),
    }

    service = new TripService(mockInternalService as unknown as TripInternalService)
  })

  it('deve delegar findActiveByVehicle para o serviço interno', async () => {
    mockInternalService.findActiveByVehicle.mockResolvedValue({ id: 'trip-1' })

    const result = await service.findActiveByVehicle('tenant-1', 'veh-1')

    expect(result).toEqual({ id: 'trip-1' })
    expect(mockInternalService.findActiveByVehicle).toHaveBeenCalledWith('tenant-1', 'veh-1')
  })

  it('deve delegar startTrip para o serviço interno', async () => {
    mockInternalService.startTrip.mockResolvedValue({ id: 'trip-1' })

    const result = await service.startTrip('veh-1', 'tenant-1')

    expect(result).toEqual({ id: 'trip-1' })
    expect(mockInternalService.startTrip).toHaveBeenCalledWith('veh-1', 'tenant-1')
  })

  it('deve delegar finishTrip para o serviço interno', async () => {
    mockInternalService.finishTrip.mockResolvedValue({ id: 'trip-1', endedAt: 'now' })

    const result = await service.finishTrip('trip-1', 'tenant-1')

    expect(result).toEqual({ id: 'trip-1', endedAt: 'now' })
    expect(mockInternalService.finishTrip).toHaveBeenCalledWith('trip-1', 'tenant-1')
  })

  it('deve delegar getTripReport para o serviço interno', async () => {
    mockInternalService.getTripReport.mockResolvedValue({ id: 'trip-1', stats: {} })

    const result = await service.getTripReport('trip-1')

    expect(result).toEqual({ id: 'trip-1', stats: {} })
    expect(mockInternalService.getTripReport).toHaveBeenCalledWith('trip-1')
  })

  it('deve delegar findActiveTrips para o serviço interno', async () => {
    mockInternalService.findActiveTrips.mockResolvedValue([{ id: 'trip-1' }])

    const result = await service.findActiveTrips()

    expect(result).toEqual([{ id: 'trip-1' }])
    expect(mockInternalService.findActiveTrips).toHaveBeenCalled()
  })

  it('deve delegar findById para o serviço interno', async () => {
    mockInternalService.findById.mockResolvedValue({ id: 'trip-1' })

    const result = await service.findById('trip-1')

    expect(result).toEqual({ id: 'trip-1' })
    expect(mockInternalService.findById).toHaveBeenCalledWith('trip-1')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import type { GeocodingService } from '../../../platform/geo/geocoding.service.js'
import { TripExternalService } from './trip.external.service.js'
import { TripInternalDto } from '../dtos/internal/trip.internal.dto.js'

describe('TripExternalService', () => {
  let service: TripExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockGeocoding: { reverse: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleTrip = new TripInternalDto({
    id: 'trip-100',
    tenantId: 'tenant-100',
    vehicleId: 'veh-100',
    startedAt: '2026-09-12T10:00:00Z',
    endedAt: '2026-09-12T10:30:00Z',
    distanceKm: 15.5,
    ignition: false,
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockGeocoding = {
      reverse: vi.fn().mockResolvedValue('Av. Paulista, São Paulo, SP'),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('trip_events_stream'),
    }

    service = new TripExternalService(
      mockRedis as unknown as Redis,
      mockGeocoding as unknown as GeocodingService,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve publicar evento TRIP_STARTED no Redis', async () => {
    await service.notifyTripStarted(sampleTrip)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'trip_events_stream',
      expect.stringContaining('"event":"TRIP_STARTED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'trip_events_stream',
      expect.stringContaining('"tripId":"trip-100"'),
    )
  })

  it('deve tolerar falhas do Redis sem lançar exceção ao notificar TRIP_STARTED', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis connection lost'))

    await expect(service.notifyTripStarted(sampleTrip)).resolves.not.toThrow()
  })

  it('deve publicar evento TRIP_FINISHED no Redis com distância', async () => {
    await service.notifyTripFinished(sampleTrip)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'trip_events_stream',
      expect.stringContaining('"event":"TRIP_FINISHED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'trip_events_stream',
      expect.stringContaining('"distanceKm":15.5'),
    )
  })

  it('deve tolerar falhas do Redis sem lançar exceção ao notificar TRIP_FINISHED', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis timeout'))

    await expect(service.notifyTripFinished(sampleTrip)).resolves.not.toThrow()
  })

  it('deve resolver endereço chamando o GeocodingService', async () => {
    const address = await service.resolveAddress(-23.5505, -46.6333)

    expect(address).toBe('Av. Paulista, São Paulo, SP')
    expect(mockGeocoding.reverse).toHaveBeenCalledWith(-23.5505, -46.6333)
  })

  it('deve retornar coordenadas formatadas caso o geocoding falhe', async () => {
    mockGeocoding.reverse.mockRejectedValueOnce(new Error('API quota exceeded'))

    const address = await service.resolveAddress(-23.5505, -46.6333)

    expect(address).toBe('Lat: -23.5505, Lng: -46.6333')
  })
})

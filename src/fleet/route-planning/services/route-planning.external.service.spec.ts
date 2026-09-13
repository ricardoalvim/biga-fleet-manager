import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import { RoutePlanningExternalService } from './route-planning.external.service.js'
import type { GeocodingService } from '../../../platform/geo/geocoding.service.js'
import { PlannedRouteInternalDto } from '../dtos/internal/planned-route.internal.dto.js'

describe('RoutePlanningExternalService', () => {
  let service: RoutePlanningExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockGeocoding: { reverse: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleRoute = new PlannedRouteInternalDto({
    id: 'route-1',
    tenantId: 'tenant-1',
    profileId: 'prof-1',
    vehicleId: 'veh-1',
    origin: { latitude: -22.6582, longitude: -50.4183, address: 'Fazenda Santa Maria' },
    destination: { latitude: -22.71, longitude: -50.5, address: 'Silo Central' },
    waypoints: [{ latitude: -22.68, longitude: -50.45, sequence: 1, address: 'Talhão 04' }],
    distanceKm: 12.8,
    estimatedDurationMinutes: 30.7,
    projectedFuelLiters: 8.32,
    status: 'PLANNED',
    dispatchedAt: null,
    createdAt: '2026-09-12T20:00:00Z',
    updatedAt: '2026-09-12T20:00:00Z',
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockGeocoding = {
      reverse: vi.fn().mockResolvedValue('Avenida Brasil, 1500, Assis - SP'),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('route_planning_events_stream'),
    }

    service = new RoutePlanningExternalService(
      mockRedis as unknown as Redis,
      mockGeocoding as unknown as GeocodingService,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve publicar evento ROUTE_CALCULATED no canal Redis', async () => {
    await service.notifyRouteCalculated(sampleRoute)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'route_planning_events_stream',
      expect.stringContaining('"event":"ROUTE_CALCULATED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'route_planning_events_stream',
      expect.stringContaining('"routeId":"route-1"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'route_planning_events_stream',
      expect.stringContaining('"distanceKm":12.8'),
    )
  })

  it('deve publicar evento ROUTE_DISPATCHED no canal Redis', async () => {
    const dispatchedRoute = new PlannedRouteInternalDto({
      ...sampleRoute,
      status: 'DISPATCHED',
      dispatchedAt: '2026-09-12T20:30:00Z',
    })

    await service.notifyRouteDispatched(dispatchedRoute)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'route_planning_events_stream',
      expect.stringContaining('"event":"ROUTE_DISPATCHED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'route_planning_events_stream',
      expect.stringContaining('"status":"DISPATCHED"'),
    )
  })

  it('deve ser resiliente a falhas temporárias do broker Redis ao calcular', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis connection down'))

    await expect(service.notifyRouteCalculated(sampleRoute)).resolves.not.toThrow()
  })

  it('deve ser resiliente a falhas temporárias do broker Redis ao despachar', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis timeout'))

    await expect(service.notifyRouteDispatched(sampleRoute)).resolves.not.toThrow()
  })

  it('deve resolver endereço reverso via GeocodingService com sucesso', async () => {
    const address = await service.resolveAddress(-22.6582, -50.4183)

    expect(mockGeocoding.reverse).toHaveBeenCalledWith(-22.6582, -50.4183)
    expect(address).toBe('Avenida Brasil, 1500, Assis - SP')
  })

  it('deve fornecer fallback amigável caso a geolocalização reversa falhe', async () => {
    mockGeocoding.reverse.mockRejectedValueOnce(new Error('Network error'))

    const address = await service.resolveAddress(-22.6582, -50.4183)

    expect(address).toContain('Lat: -22.6582')
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TelemetryProcessorService } from './telemetry-processor.service.js'
import type { ConfigService } from '@nestjs/config'
import type { TripService } from '../fleet/trip/trip.service.js'

describe('TelemetryProcessorService', () => {
  let service: TelemetryProcessorService
  let mockRedis: any
  let mockTelemetryModel: any
  let mockTrips: any
  let mockConfig: Partial<ConfigService>

  beforeEach(() => {
    mockRedis = {
      subscribe: vi.fn(),
      on: vi.fn(),
    }

    mockTelemetryModel = {
      create: vi.fn().mockResolvedValue({}),
    }

    mockTrips = {
      findActiveByVehicle: vi.fn(),
      startTrip: vi.fn(),
      finishTrip: vi.fn(),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('vehicle_telemetry_stream'),
    }

    service = new TelemetryProcessorService(
      mockRedis,
      mockTelemetryModel,
      mockTrips as TripService,
      mockConfig as ConfigService,
    )
  })

  it('deve subscrever ao canal redis configurado no onModuleInit', () => {
    service.onModuleInit()

    expect(mockRedis.subscribe).toHaveBeenCalledWith(
      'vehicle_telemetry_stream',
      expect.any(Function),
    )
    expect(mockRedis.on).toHaveBeenCalledWith('message', expect.any(Function))
  })

  it('deve iniciar viagem e persistir telemetria quando ignição for true e não houver viagem ativa', async () => {
    service.onModuleInit()

    mockTrips.findActiveByVehicle.mockResolvedValue(null)
    mockTrips.startTrip.mockResolvedValue({ id: 'trip-100' })

    const payload = {
      tenantId: '00000000-0000-4000-8000-000000000001',
      deviceId: 'veh-001',
      ignition: true,
      lat: -23.55,
      lng: -46.63,
      speed: 50,
      timestamp: '2026-01-01T10:00:00.000Z',
    }

    await (service as any).processIncomingTelemetry(JSON.stringify(payload))

    expect(mockTrips.findActiveByVehicle).toHaveBeenCalledWith(payload.tenantId, payload.deviceId)
    expect(mockTrips.startTrip).toHaveBeenCalledWith(payload.deviceId, payload.tenantId)
    expect(mockTelemetryModel.create).toHaveBeenCalledWith({
      tenantId: payload.tenantId,
      deviceId: payload.deviceId,
      vehicleId: payload.deviceId,
      tripId: 'trip-100',
      latitude: -23.55,
      longitude: -46.63,
      speed: 50,
      timestamp: new Date('2026-01-01T10:00:00.000Z'),
    })
  })

  it('deve finalizar viagem quando ignição for false e houver viagem ativa', async () => {
    service.onModuleInit()

    mockTrips.findActiveByVehicle.mockResolvedValue({ id: 'trip-active' })

    const payload = {
      tenantId: '00000000-0000-4000-8000-000000000001',
      deviceId: 'veh-001',
      ignition: false,
      lat: -23.55,
      lng: -46.63,
      speed: 0,
    }

    await (service as any).processIncomingTelemetry(JSON.stringify(payload))

    expect(mockTrips.finishTrip).toHaveBeenCalledWith('trip-active', payload.tenantId)
  })
})

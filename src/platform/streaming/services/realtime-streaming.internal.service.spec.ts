import { beforeEach, describe, expect, it } from 'vitest'
import { RealtimeStreamingInternalService } from './realtime-streaming.internal.service.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import type { PublishRealtimeEventDto } from '../dtos/external/publish-realtime-event.dto.js'

describe('RealtimeStreamingInternalService', () => {
  let service: RealtimeStreamingInternalService
  let mockTenantContext: Partial<TenantContext>

  beforeEach(() => {
    mockTenantContext = {
      tenantId: '00000000-0000-4000-8000-000000000001',
    }
    service = new RealtimeStreamingInternalService(mockTenantContext as TenantContext, {
      positionThrottleMs: 2000,
    })
  })

  it('deve emitir evento de posição e notificar o assinante do tenant', () => {
    const receivedEvents: any[] = []
    const sub = service.getTenantStream('00000000-0000-4000-8000-000000000001').subscribe((evt) => {
      receivedEvents.push(evt)
    })

    const dto: PublishRealtimeEventDto = {
      event: 'vehicle.position.updated',
      vehicleId: 'veh-001',
      data: {
        latitude: -22.6582,
        longitude: -50.4183,
        speed: 60,
        heading: 90,
        ignition: true,
        timestamp: new Date().toISOString(),
      },
    }

    const emitted = service.publishEvent(dto)
    expect(emitted).toBe(true)
    expect(receivedEvents).toHaveLength(1)
    expect(receivedEvents[0].type).toBe('vehicle.position.updated')
    expect(receivedEvents[0].data.vehicleId).toBe('veh-001')

    sub.unsubscribe()
  })

  it('deve aplicar throttle em atualizações frequentes de posição no mesmo veículo', () => {
    const dto: PublishRealtimeEventDto = {
      event: 'vehicle.position.updated',
      vehicleId: 'veh-001',
      data: {
        latitude: -22.6582,
        longitude: -50.4183,
        speed: 60,
        heading: 90,
        ignition: true,
        timestamp: new Date().toISOString(),
      },
    }

    const first = service.publishEvent(dto)
    const second = service.publishEvent(dto) // Dentro dos 2000ms

    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  it('deve ignorar o throttle caso haja mudança de ignição', () => {
    const dtoOn: PublishRealtimeEventDto = {
      event: 'vehicle.position.updated',
      vehicleId: 'veh-001',
      data: {
        latitude: -22.6582,
        longitude: -50.4183,
        speed: 0,
        heading: 90,
        ignition: true,
        timestamp: new Date().toISOString(),
      },
    }

    const dtoOff: PublishRealtimeEventDto = {
      event: 'vehicle.position.updated',
      vehicleId: 'veh-001',
      data: {
        latitude: -22.6582,
        longitude: -50.4183,
        speed: 0,
        heading: 90,
        ignition: false, // Mudou ignição!
        timestamp: new Date().toISOString(),
      },
    }

    const first = service.publishEvent(dtoOn)
    const second = service.publishEvent(dtoOff)

    expect(first).toBe(true)
    expect(second).toBe(true)
  })

  it('deve transmitir eventos de alerta de geofence imediatamente sem throttle', () => {
    const alertDto: PublishRealtimeEventDto = {
      event: 'geofence.alert',
      vehicleId: 'veh-001',
      data: {
        geofenceId: 'geo-1',
        geofenceName: 'Área Restrita',
        action: 'ENTER',
        timestamp: new Date().toISOString(),
      },
    }

    const first = service.publishEvent(alertDto)
    const second = service.publishEvent(alertDto)

    expect(first).toBe(true)
    expect(second).toBe(true)
  })

  it('deve garantir isolamento multi-tenant (tenant B não recebe eventos do tenant A)', () => {
    const tenantAEve: any[] = []
    const tenantBEve: any[] = []

    const subA = service.getTenantStream('tenant-A').subscribe((e) => tenantAEve.push(e))
    const subB = service.getTenantStream('tenant-B').subscribe((e) => tenantBEve.push(e))

    service.publishEvent(
      {
        event: 'trip.status.changed',
        vehicleId: 'veh-001',
        data: { tripId: 'trip-1', status: 'STARTED', timestamp: new Date().toISOString() },
      },
      'tenant-A',
    )

    expect(tenantAEve).toHaveLength(1)
    expect(tenantBEve).toHaveLength(0)

    subA.unsubscribe()
    subB.unsubscribe()
  })
})

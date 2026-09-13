import { describe, expect, it } from 'vitest'
import {
  RealtimeStreamEventEntity,
  type RealtimePositionData,
  type RealtimeGeofenceData,
} from './realtime-stream-event.entity.js'

describe('RealtimeStreamEventEntity', () => {
  it('deve instanciar com sucesso um evento de posição de veículo válido', () => {
    const posData: RealtimePositionData = {
      latitude: -22.6582,
      longitude: -50.4183,
      speed: 65.5,
      heading: 180,
      ignition: true,
      timestamp: new Date().toISOString(),
    }

    const entity = new RealtimeStreamEventEntity({
      id: 'evt-001',
      event: 'vehicle.position.updated',
      tenantId: 'tenant-1',
      vehicleId: 'veh-100',
      data: posData,
    })

    expect(entity.id).toBe('evt-001')
    expect(entity.event).toBe('vehicle.position.updated')
    expect(entity.tenantId).toBe('tenant-1')
    expect(entity.vehicleId).toBe('veh-100')
    expect(entity.isCritical()).toBe(false)
  })

  it('deve identificar alertas de geofence como eventos críticos', () => {
    const alertData: RealtimeGeofenceData = {
      geofenceId: 'geo-001',
      geofenceName: 'Pátio Central',
      action: 'ENTER',
      timestamp: new Date().toISOString(),
    }

    const entity = new RealtimeStreamEventEntity({
      id: 'evt-002',
      event: 'geofence.alert',
      tenantId: 'tenant-1',
      vehicleId: 'veh-100',
      data: alertData,
    })

    expect(entity.isCritical()).toBe(true)
  })

  it('deve rejeitar coordenadas inválidas', () => {
    expect(
      () =>
        new RealtimeStreamEventEntity({
          id: 'evt-003',
          event: 'vehicle.position.updated',
          tenantId: 'tenant-1',
          vehicleId: 'veh-100',
          data: {
            latitude: 105.0, // Inválido (> 90)
            longitude: -50.4183,
            speed: 50,
            heading: 90,
            ignition: true,
            timestamp: new Date().toISOString(),
          },
        }),
    ).toThrow('Latitude inválida')
  })

  it('deve rejeitar velocidade negativa', () => {
    expect(
      () =>
        new RealtimeStreamEventEntity({
          id: 'evt-004',
          event: 'vehicle.position.updated',
          tenantId: 'tenant-1',
          vehicleId: 'veh-100',
          data: {
            latitude: -22.0,
            longitude: -50.0,
            speed: -5,
            heading: 90,
            ignition: true,
            timestamp: new Date().toISOString(),
          },
        }),
    ).toThrow('Velocidade inválida')
  })

  it('deve rejeitar evento com tipo não suportado', () => {
    expect(
      () =>
        new RealtimeStreamEventEntity({
          id: 'evt-005',
          event: 'invalid.event' as any,
          tenantId: 'tenant-1',
          vehicleId: 'veh-100',
          data: { timestamp: new Date().toISOString() } as any,
        }),
    ).toThrow('Tipo de evento de streaming inválido')
  })
})

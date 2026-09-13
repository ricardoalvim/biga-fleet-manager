export type RealtimeEventType =
  'vehicle.position.updated' | 'trip.status.changed' | 'geofence.alert'

export interface RealtimePositionData {
  readonly latitude: number
  readonly longitude: number
  readonly speed: number
  readonly heading: number
  readonly ignition: boolean
  readonly timestamp: string
  readonly odometerKm?: number
  readonly fuelLevelPercent?: number
}

export interface RealtimeTripData {
  readonly tripId: string
  readonly status: 'STARTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  readonly origin?: string
  readonly destination?: string
  readonly timestamp: string
}

export interface RealtimeGeofenceData {
  readonly geofenceId: string
  readonly geofenceName: string
  readonly action: 'ENTER' | 'EXIT' | 'SPEEDING_VIOLATION'
  readonly speedObserved?: number
  readonly speedLimit?: number
  readonly timestamp: string
}

export type RealtimeEventPayload = RealtimePositionData | RealtimeTripData | RealtimeGeofenceData

export interface RealtimeStreamEventProps {
  readonly id: string
  readonly event: RealtimeEventType
  readonly tenantId: string
  readonly vehicleId: string
  readonly data: RealtimeEventPayload
  readonly timestamp?: Date
}

export class RealtimeStreamEventEntity {
  readonly id: string
  readonly event: RealtimeEventType
  readonly tenantId: string
  readonly vehicleId: string
  readonly data: RealtimeEventPayload
  readonly timestamp: Date

  constructor(props: RealtimeStreamEventProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ID do evento em tempo real é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim() === '') {
      throw new Error('Tenant ID é obrigatório para isolamento do streaming')
    }
    if (!props.vehicleId || props.vehicleId.trim() === '') {
      throw new Error('Vehicle ID é obrigatório para roteamento do streaming')
    }

    if (
      !['vehicle.position.updated', 'trip.status.changed', 'geofence.alert'].includes(props.event)
    ) {
      throw new Error(`Tipo de evento de streaming inválido: ${props.event}`)
    }

    if (props.event === 'vehicle.position.updated') {
      const pos = props.data as RealtimePositionData
      if (typeof pos.latitude !== 'number' || pos.latitude < -90 || pos.latitude > 90) {
        throw new Error(`Latitude inválida [-90, 90]: ${pos.latitude}`)
      }
      if (typeof pos.longitude !== 'number' || pos.longitude < -180 || pos.longitude > 180) {
        throw new Error(`Longitude inválida [-180, 180]: ${pos.longitude}`)
      }
      if (typeof pos.speed !== 'number' || pos.speed < 0) {
        throw new Error(`Velocidade inválida (deve ser >= 0): ${pos.speed}`)
      }
      if (typeof pos.heading !== 'number' || pos.heading < 0 || pos.heading > 360) {
        throw new Error(`Heading/Azimute inválido [0, 360]: ${pos.heading}`)
      }
      if (typeof pos.ignition !== 'boolean') {
        throw new Error('Status de ignição deve ser um valor booleano')
      }
    }

    this.id = props.id
    this.event = props.event
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.data = Object.freeze({ ...props.data })
    this.timestamp = props.timestamp ?? new Date()

    Object.freeze(this)
  }

  isCritical(): boolean {
    return this.event === 'geofence.alert' || this.event === 'trip.status.changed'
  }
}

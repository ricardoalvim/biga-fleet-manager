export interface LiveVehicleState {
  readonly vehicleId: string
  readonly plate?: string
  readonly latitude: number
  readonly longitude: number
  readonly speed: number
  readonly heading: number
  readonly ignition: boolean
  readonly timestamp: string
  readonly odometerKm?: number
  readonly fuelLevelPercent?: number
  readonly lastAlert?: {
    readonly geofenceName: string
    readonly action: 'ENTER' | 'EXIT' | 'SPEEDING_VIOLATION'
    readonly timestamp: string
  }
}

export interface RealtimeStreamMessage {
  readonly event: 'vehicle.position.updated' | 'trip.status.changed' | 'geofence.alert'
  readonly tenantId: string
  readonly vehicleId: string
  readonly data: Record<string, unknown>
  readonly timestamp: string
}


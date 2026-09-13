export interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
  readonly address?: string
}

export interface Waypoint {
  readonly latitude: number
  readonly longitude: number
  readonly sequence: number
  readonly address?: string
}

export type PlannedRouteStatus =
  'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface PlannedRouteProps {
  id: string
  tenantId: string
  profileId: string
  vehicleId: string
  origin: GeoPoint
  destination: GeoPoint
  waypoints: Waypoint[]
  distanceKm: number
  estimatedDurationMinutes: number
  projectedFuelLiters: number
  status?: PlannedRouteStatus
  dispatchedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class PlannedRouteEntity {
  readonly id: string
  readonly tenantId: string
  readonly profileId: string
  readonly vehicleId: string
  readonly origin: GeoPoint
  readonly destination: GeoPoint
  readonly waypoints: readonly Waypoint[]
  readonly distanceKm: number
  readonly estimatedDurationMinutes: number
  readonly projectedFuelLiters: number
  readonly status: PlannedRouteStatus
  readonly dispatchedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: PlannedRouteProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID da rota planejada é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.profileId || props.profileId.trim().length === 0) {
      throw new Error('Profile ID é obrigatório')
    }
    if (!props.vehicleId || props.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID é obrigatório')
    }

    PlannedRouteEntity.validateCoordinates(props.origin.latitude, props.origin.longitude, 'Origem')
    PlannedRouteEntity.validateCoordinates(
      props.destination.latitude,
      props.destination.longitude,
      'Destino',
    )

    const sortedWaypoints = [...(props.waypoints ?? [])].sort((a, b) => a.sequence - b.sequence)
    for (const wp of sortedWaypoints) {
      PlannedRouteEntity.validateCoordinates(wp.latitude, wp.longitude, `Waypoint #${wp.sequence}`)
    }

    if (props.distanceKm < 0) {
      throw new Error('Distância não pode ser negativa')
    }
    if (props.estimatedDurationMinutes < 0) {
      throw new Error('Duração estimada não pode ser negativa')
    }
    if (props.projectedFuelLiters < 0) {
      throw new Error('Consumo projetado não pode ser negativo')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.profileId = props.profileId
    this.vehicleId = props.vehicleId
    this.origin = Object.freeze({
      latitude: props.origin.latitude,
      longitude: props.origin.longitude,
      address: props.origin.address,
    })
    this.destination = Object.freeze({
      latitude: props.destination.latitude,
      longitude: props.destination.longitude,
      address: props.destination.address,
    })
    this.waypoints = Object.freeze(
      sortedWaypoints.map((wp) =>
        Object.freeze({
          latitude: wp.latitude,
          longitude: wp.longitude,
          sequence: wp.sequence,
          address: wp.address,
        }),
      ),
    )
    this.distanceKm = Number(props.distanceKm)
    this.estimatedDurationMinutes = Number(props.estimatedDurationMinutes)
    this.projectedFuelLiters = Number(props.projectedFuelLiters)
    this.status = props.status ?? 'PLANNED'
    this.dispatchedAt = props.dispatchedAt ?? null
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }

  static validateCoordinates(lat: number, lng: number, label: string): void {
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Latitude inválida para ${label}: deve estar entre -90 e 90`)
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error(`Longitude inválida para ${label}: deve estar entre -180 e 180`)
    }
  }

  dispatch(): PlannedRouteEntity {
    if (this.status !== 'PLANNED') {
      throw new Error(`Rota já foi despachada ou finalizada (status atual: ${this.status})`)
    }

    return new PlannedRouteEntity({
      id: this.id,
      tenantId: this.tenantId,
      profileId: this.profileId,
      vehicleId: this.vehicleId,
      origin: this.origin,
      destination: this.destination,
      waypoints: [...this.waypoints],
      distanceKm: this.distanceKm,
      estimatedDurationMinutes: this.estimatedDurationMinutes,
      projectedFuelLiters: this.projectedFuelLiters,
      status: 'DISPATCHED',
      dispatchedAt: new Date(),
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}

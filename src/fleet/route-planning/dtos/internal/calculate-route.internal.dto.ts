import type { GeoPoint, Waypoint, PlannedRouteStatus } from '../../entities/planned-route.entity.js'

export interface SavePlannedRouteInternalProps {
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
  readonly dispatchedAt?: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class SavePlannedRouteInternalDto {
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

  constructor(props: SavePlannedRouteInternalProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.profileId = props.profileId
    this.vehicleId = props.vehicleId
    this.origin = Object.freeze({ ...props.origin })
    this.destination = Object.freeze({ ...props.destination })
    this.waypoints = Object.freeze(props.waypoints.map((wp) => Object.freeze({ ...wp })))
    this.distanceKm = props.distanceKm
    this.estimatedDurationMinutes = props.estimatedDurationMinutes
    this.projectedFuelLiters = props.projectedFuelLiters
    this.status = props.status
    this.dispatchedAt = props.dispatchedAt ?? null
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}

import type { GeoPoint, Waypoint, PlannedRouteStatus } from '../../entities/planned-route.entity.js'
import type { RouteProfileInternalDto } from './route-profile.internal.dto.js'

export interface RouteVehicleSummaryProps {
  readonly id: string
  readonly plate: string
  readonly model?: string
}

export class RouteVehicleSummaryDto {
  readonly id: string
  readonly plate: string
  readonly model?: string

  constructor(props: RouteVehicleSummaryProps) {
    this.id = props.id
    this.plate = props.plate
    this.model = props.model

    Object.freeze(this)
  }
}

export interface PlannedRouteInternalDtoProps {
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
  readonly dispatchedAt?: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly vehicle?: RouteVehicleSummaryDto
  readonly profile?: RouteProfileInternalDto
}

export class PlannedRouteInternalDto {
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
  readonly dispatchedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly vehicle?: RouteVehicleSummaryDto
  readonly profile?: RouteProfileInternalDto

  constructor(props: PlannedRouteInternalDtoProps) {
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
    this.vehicle = props.vehicle
    this.profile = props.profile

    Object.freeze(this)
  }
}

export interface TripVehicleSummaryProps {
  readonly id: string
  readonly plate: string
  readonly model?: string
}

export class TripVehicleSummaryDto {
  readonly id: string
  readonly plate: string
  readonly model?: string

  constructor(props: TripVehicleSummaryProps) {
    this.id = props.id
    this.plate = props.plate
    this.model = props.model

    Object.freeze(this)
  }
}

export interface TripInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly startedAt: string
  readonly endedAt?: string | null
  readonly distanceKm: number
  readonly ignition: boolean
  readonly vehicle?: TripVehicleSummaryDto
}

export class TripInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly startedAt: string
  readonly endedAt: string | null
  readonly distanceKm: number
  readonly ignition: boolean
  readonly vehicle?: TripVehicleSummaryDto

  constructor(props: TripInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.startedAt = props.startedAt
    this.endedAt = props.endedAt ?? null
    this.distanceKm = props.distanceKm
    this.ignition = props.ignition
    this.vehicle = props.vehicle

    Object.freeze(this)
  }
}

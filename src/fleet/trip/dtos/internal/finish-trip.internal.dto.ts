export interface FinishTripInternalDtoProps {
  readonly tripId: string
  readonly tenantId: string
  readonly endedAt: string
  readonly distanceKm: number
}

export class FinishTripInternalDto {
  readonly tripId: string
  readonly tenantId: string
  readonly endedAt: string
  readonly distanceKm: number

  constructor(props: FinishTripInternalDtoProps) {
    this.tripId = props.tripId
    this.tenantId = props.tenantId
    this.endedAt = props.endedAt
    this.distanceKm = props.distanceKm

    Object.freeze(this)
  }
}

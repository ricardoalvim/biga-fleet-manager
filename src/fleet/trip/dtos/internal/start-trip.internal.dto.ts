export interface StartTripInternalDtoProps {
  readonly tenantId: string
  readonly vehicleId: string
}

export class StartTripInternalDto {
  readonly tenantId: string
  readonly vehicleId: string

  constructor(props: StartTripInternalDtoProps) {
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId

    Object.freeze(this)
  }
}

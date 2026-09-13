export interface CreateTollEventInternalDtoProps {
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: string
}

export class CreateTollEventInternalDto {
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: string

  constructor(props: CreateTollEventInternalDtoProps) {
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.tollPlazaName = props.tollPlazaName
    this.externalTransactionId = props.externalTransactionId
    this.amount = props.amount
    this.passedAt = props.passedAt

    Object.freeze(this)
  }
}

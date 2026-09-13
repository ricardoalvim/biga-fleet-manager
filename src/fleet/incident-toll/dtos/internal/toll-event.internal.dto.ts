export interface TollEventInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: string
  readonly createdAt: string
}

export class TollEventInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: string
  readonly createdAt: string

  constructor(props: TollEventInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.tollPlazaName = props.tollPlazaName
    this.externalTransactionId = props.externalTransactionId
    this.amount = props.amount
    this.passedAt = props.passedAt
    this.createdAt = props.createdAt

    Object.freeze(this)
  }
}

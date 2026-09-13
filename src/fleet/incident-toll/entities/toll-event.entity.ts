export interface TollEventEntityProps {
  id: string
  tenantId: string
  vehicleId: string
  tollPlazaName: string
  externalTransactionId: string
  amount: number
  passedAt: Date
}

export class TollEventEntity {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: Date

  constructor(props: TollEventEntityProps) {
    if (!props.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório para a passagem de pedágio')
    }
    if (!props.vehicleId?.trim()) {
      throw new Error('Vehicle ID é obrigatório para a passagem de pedágio')
    }
    if (!props.tollPlazaName?.trim()) {
      throw new Error('Nome da praça de pedágio é obrigatório')
    }
    if (!props.externalTransactionId?.trim()) {
      throw new Error('Identificador da transação externa é obrigatório')
    }
    if (props.amount < 0) {
      throw new Error('Valor do pedágio não pode ser negativo')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.tollPlazaName = props.tollPlazaName.trim()
    this.externalTransactionId = props.externalTransactionId.trim()
    this.amount = Number(props.amount.toFixed(2))
    this.passedAt = props.passedAt

    Object.freeze(this)
  }
}

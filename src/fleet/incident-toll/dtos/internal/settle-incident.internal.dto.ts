export interface SettleIncidentInternalDtoProps {
  readonly incidentId: string
  readonly tenantId: string
  readonly actualCost: number
  readonly settledAt?: string
}

export class SettleIncidentInternalDto {
  readonly incidentId: string
  readonly tenantId: string
  readonly actualCost: number
  readonly settledAt?: string

  constructor(props: SettleIncidentInternalDtoProps) {
    this.incidentId = props.incidentId
    this.tenantId = props.tenantId
    this.actualCost = props.actualCost
    this.settledAt = props.settledAt

    Object.freeze(this)
  }
}

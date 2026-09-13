import type { IncidentType } from '../../entities/incident.entity.js'

export interface CreateIncidentInternalDtoProps {
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: IncidentType
  readonly description: string
  readonly estimatedCost: number
  readonly occurredAt: string
}

export class CreateIncidentInternalDto {
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: IncidentType
  readonly description: string
  readonly estimatedCost: number
  readonly occurredAt: string

  constructor(props: CreateIncidentInternalDtoProps) {
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.responsibleCompanyId = props.responsibleCompanyId
    this.incidentType = props.incidentType
    this.description = props.description
    this.estimatedCost = props.estimatedCost
    this.occurredAt = props.occurredAt

    Object.freeze(this)
  }
}

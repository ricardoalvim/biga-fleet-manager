import type { IncidentType, IncidentStatus } from '../../entities/incident.entity.js'

export interface IncidentVehicleSummaryProps {
  readonly id: string
  readonly plate: string
  readonly model?: string
}

export class IncidentVehicleSummaryDto {
  readonly id: string
  readonly plate: string
  readonly model?: string

  constructor(props: IncidentVehicleSummaryProps) {
    this.id = props.id
    this.plate = props.plate
    this.model = props.model

    Object.freeze(this)
  }
}

export interface IncidentResponsibleCompanyProps {
  readonly id: string
  readonly name: string
  readonly type: string
}

export class IncidentResponsibleCompanyDto {
  readonly id: string
  readonly name: string
  readonly type: string

  constructor(props: IncidentResponsibleCompanyProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type

    Object.freeze(this)
  }
}

export interface IncidentInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: IncidentType
  readonly description: string
  readonly estimatedCost: number
  readonly actualCost?: number | null
  readonly status: IncidentStatus
  readonly occurredAt: string
  readonly settledAt?: string | null
  readonly createdAt: string
  readonly vehicle?: IncidentVehicleSummaryDto
  readonly responsibleCompany?: IncidentResponsibleCompanyDto
}

export class IncidentInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: IncidentType
  readonly description: string
  readonly estimatedCost: number
  readonly actualCost: number | null
  readonly status: IncidentStatus
  readonly occurredAt: string
  readonly settledAt: string | null
  readonly createdAt: string
  readonly vehicle?: IncidentVehicleSummaryDto
  readonly responsibleCompany?: IncidentResponsibleCompanyDto

  constructor(props: IncidentInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.responsibleCompanyId = props.responsibleCompanyId
    this.incidentType = props.incidentType
    this.description = props.description
    this.estimatedCost = props.estimatedCost
    this.actualCost = props.actualCost ?? null
    this.status = props.status
    this.occurredAt = props.occurredAt
    this.settledAt = props.settledAt ?? null
    this.createdAt = props.createdAt
    this.vehicle = props.vehicle
    this.responsibleCompany = props.responsibleCompany

    Object.freeze(this)
  }
}

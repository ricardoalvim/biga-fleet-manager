export type IncidentType = 'ACCIDENT' | 'FINE' | 'DAMAGE' | 'THEFT' | 'OTHER'
export type IncidentStatus = 'OPEN' | 'IN_REVIEW' | 'SETTLED' | 'CANCELLED'

export interface IncidentEntityProps {
  id: string
  tenantId: string
  vehicleId: string
  responsibleCompanyId: string
  incidentType: IncidentType
  description: string
  estimatedCost: number
  actualCost?: number | null
  status: IncidentStatus
  occurredAt: Date
  settledAt?: Date | null
}

export class IncidentEntity {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: IncidentType
  readonly description: string
  readonly estimatedCost: number
  readonly actualCost: number | null
  readonly status: IncidentStatus
  readonly occurredAt: Date
  readonly settledAt: Date | null

  constructor(props: IncidentEntityProps) {
    if (!props.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório para a ocorrência')
    }
    if (!props.vehicleId?.trim()) {
      throw new Error('Vehicle ID é obrigatório para a ocorrência')
    }
    if (!props.responsibleCompanyId?.trim()) {
      throw new Error('Empresa responsável é obrigatória para a ocorrência')
    }
    if (!props.description?.trim()) {
      throw new Error('Descrição da ocorrência é obrigatória')
    }
    if (props.estimatedCost < 0) {
      throw new Error('Custo estimado não pode ser negativo')
    }
    if (props.actualCost !== undefined && props.actualCost !== null && props.actualCost < 0) {
      throw new Error('Custo real liquidado não pode ser negativo')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.responsibleCompanyId = props.responsibleCompanyId
    this.incidentType = props.incidentType
    this.description = props.description.trim()
    this.estimatedCost = Number(props.estimatedCost.toFixed(2))
    this.actualCost =
      props.actualCost !== undefined && props.actualCost !== null
        ? Number(props.actualCost.toFixed(2))
        : null
    this.status = props.status
    this.occurredAt = props.occurredAt
    this.settledAt = props.settledAt ?? null

    Object.freeze(this)
  }

  static create(
    tenantId: string,
    vehicleId: string,
    responsibleCompanyId: string,
    incidentType: IncidentType,
    description: string,
    estimatedCost: number,
    occurredAt: Date,
    id = crypto.randomUUID(),
  ): IncidentEntity {
    return new IncidentEntity({
      id,
      tenantId,
      vehicleId,
      responsibleCompanyId,
      incidentType,
      description,
      estimatedCost,
      actualCost: null,
      status: 'OPEN',
      occurredAt,
      settledAt: null,
    })
  }

  settle(actualCost: number, settledAt = new Date()): IncidentEntity {
    if (this.status === 'SETTLED') {
      throw new Error('A ocorrência já se encontra liquidada')
    }
    if (actualCost < 0) {
      throw new Error('O custo real da liquidação não pode ser negativo')
    }

    return new IncidentEntity({
      id: this.id,
      tenantId: this.tenantId,
      vehicleId: this.vehicleId,
      responsibleCompanyId: this.responsibleCompanyId,
      incidentType: this.incidentType,
      description: this.description,
      estimatedCost: this.estimatedCost,
      actualCost,
      status: 'SETTLED',
      occurredAt: this.occurredAt,
      settledAt,
    })
  }
}

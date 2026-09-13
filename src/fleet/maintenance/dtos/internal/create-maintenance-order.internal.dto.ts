import type { MaintenanceOrderType } from '../../entities/maintenance-order.entity.js'

export interface CreateMaintenanceOrderInternalDtoProps {
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: MaintenanceOrderType
  readonly scheduledDate: string
}

export class CreateMaintenanceOrderInternalDto {
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: MaintenanceOrderType
  readonly scheduledDate: string

  constructor(props: CreateMaintenanceOrderInternalDtoProps) {
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.providerId = props.providerId
    this.type = props.type
    this.scheduledDate = props.scheduledDate

    Object.freeze(this)
  }
}

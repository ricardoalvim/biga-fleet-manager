import type { MaintenanceOrderItemDto } from './maintenance-order.internal.dto.js'

export interface CompleteMaintenanceOrderInternalDtoProps {
  readonly orderId: string
  readonly tenantId: string
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItemDto>
  readonly completedAt?: string
}

export class CompleteMaintenanceOrderInternalDto {
  readonly orderId: string
  readonly tenantId: string
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItemDto>
  readonly completedAt?: string

  constructor(props: CompleteMaintenanceOrderInternalDtoProps) {
    this.orderId = props.orderId
    this.tenantId = props.tenantId
    this.downtimeHours = props.downtimeHours
    this.downtimeCostPerHour = props.downtimeCostPerHour
    this.executedItems = Object.freeze([...props.executedItems])
    this.completedAt = props.completedAt

    Object.freeze(this)
  }
}

import type { MaintenancePlanItemDto } from './maintenance-plan.internal.dto.js'

export interface CreateMaintenancePlanInternalDtoProps {
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItemDto>
}

export class CreateMaintenancePlanInternalDto {
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItemDto>

  constructor(props: CreateMaintenancePlanInternalDtoProps) {
    this.tenantId = props.tenantId
    this.name = props.name
    this.triggerKm = props.triggerKm
    this.items = Object.freeze([...props.items])

    Object.freeze(this)
  }
}

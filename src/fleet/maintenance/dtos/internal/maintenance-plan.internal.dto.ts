import type { MaintenanceAction } from '../../entities/maintenance-plan.entity.js'

export interface MaintenancePlanItemDtoProps {
  readonly description: string
  readonly action: MaintenanceAction
}

export class MaintenancePlanItemDto {
  readonly description: string
  readonly action: MaintenanceAction

  constructor(props: MaintenancePlanItemDtoProps) {
    this.description = props.description
    this.action = props.action

    Object.freeze(this)
  }
}

export interface MaintenancePlanInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItemDto>
  readonly createdAt: string
}

export class MaintenancePlanInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItemDto>
  readonly createdAt: string

  constructor(props: MaintenancePlanInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name
    this.triggerKm = props.triggerKm
    this.items = Object.freeze([...props.items])
    this.createdAt = props.createdAt

    Object.freeze(this)
  }
}

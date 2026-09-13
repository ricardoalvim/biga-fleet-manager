import type {
  MaintenanceOrderType,
  MaintenanceOrderStatus,
} from '../../entities/maintenance-order.entity.js'
import type { MaintenanceAction } from '../../entities/maintenance-plan.entity.js'

export interface MaintenanceOrderItemDtoProps {
  readonly description: string
  readonly action: MaintenanceAction
  readonly partCost: number
  readonly laborCost: number
}

export class MaintenanceOrderItemDto {
  readonly description: string
  readonly action: MaintenanceAction
  readonly partCost: number
  readonly laborCost: number

  constructor(props: MaintenanceOrderItemDtoProps) {
    this.description = props.description
    this.action = props.action
    this.partCost = props.partCost
    this.laborCost = props.laborCost

    Object.freeze(this)
  }
}

export interface MaintenanceOrderVehicleSummaryProps {
  readonly id: string
  readonly plate: string
  readonly model?: string
}

export class MaintenanceOrderVehicleSummaryDto {
  readonly id: string
  readonly plate: string
  readonly model?: string

  constructor(props: MaintenanceOrderVehicleSummaryProps) {
    this.id = props.id
    this.plate = props.plate
    this.model = props.model

    Object.freeze(this)
  }
}

export interface MaintenanceOrderProviderSummaryProps {
  readonly id: string
  readonly name: string
  readonly type: string
}

export class MaintenanceOrderProviderSummaryDto {
  readonly id: string
  readonly name: string
  readonly type: string

  constructor(props: MaintenanceOrderProviderSummaryProps) {
    this.id = props.id
    this.name = props.name
    this.type = props.type

    Object.freeze(this)
  }
}

export interface MaintenanceOrderInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: MaintenanceOrderType
  readonly status: MaintenanceOrderStatus
  readonly scheduledDate: string
  readonly completedAt?: string | null
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly totalPartsCost: number
  readonly totalLaborCost: number
  readonly totalDowntimeCost: number
  readonly totalCost: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItemDto>
  readonly createdAt: string
  readonly vehicle?: MaintenanceOrderVehicleSummaryDto
  readonly provider?: MaintenanceOrderProviderSummaryDto
}

export class MaintenanceOrderInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: MaintenanceOrderType
  readonly status: MaintenanceOrderStatus
  readonly scheduledDate: string
  readonly completedAt: string | null
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly totalPartsCost: number
  readonly totalLaborCost: number
  readonly totalDowntimeCost: number
  readonly totalCost: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItemDto>
  readonly createdAt: string
  readonly vehicle?: MaintenanceOrderVehicleSummaryDto
  readonly provider?: MaintenanceOrderProviderSummaryDto

  constructor(props: MaintenanceOrderInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.providerId = props.providerId
    this.type = props.type
    this.status = props.status
    this.scheduledDate = props.scheduledDate
    this.completedAt = props.completedAt ?? null
    this.downtimeHours = props.downtimeHours
    this.downtimeCostPerHour = props.downtimeCostPerHour
    this.totalPartsCost = props.totalPartsCost
    this.totalLaborCost = props.totalLaborCost
    this.totalDowntimeCost = props.totalDowntimeCost
    this.totalCost = props.totalCost
    this.executedItems = Object.freeze([...props.executedItems])
    this.createdAt = props.createdAt
    this.vehicle = props.vehicle
    this.provider = props.provider

    Object.freeze(this)
  }
}

import type { MaintenanceAction } from './maintenance-plan.entity.js'

export type MaintenanceOrderType = 'PREVENTIVE' | 'CORRECTIVE'
export type MaintenanceOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface MaintenanceOrderItem {
  readonly description: string
  readonly action: MaintenanceAction
  readonly partCost: number
  readonly laborCost: number
}

export interface MaintenanceOrderEntityProps {
  id: string
  tenantId: string
  vehicleId: string
  providerId: string
  type: MaintenanceOrderType
  status: MaintenanceOrderStatus
  scheduledDate: Date
  completedAt?: Date | null
  downtimeHours?: number
  downtimeCostPerHour?: number
  totalPartsCost?: number
  totalLaborCost?: number
  totalDowntimeCost?: number
  totalCost?: number
  executedItems?: ReadonlyArray<MaintenanceOrderItem>
}

export class MaintenanceOrderEntity {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: MaintenanceOrderType
  readonly status: MaintenanceOrderStatus
  readonly scheduledDate: Date
  readonly completedAt: Date | null
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly totalPartsCost: number
  readonly totalLaborCost: number
  readonly totalDowntimeCost: number
  readonly totalCost: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItem>

  constructor(props: MaintenanceOrderEntityProps) {
    if (!props.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório para a ordem de serviço')
    }
    if (!props.vehicleId?.trim()) {
      throw new Error('Vehicle ID é obrigatório para a ordem de serviço')
    }
    if (!props.providerId?.trim()) {
      throw new Error('Provider ID é obrigatório para a ordem de serviço')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.providerId = props.providerId
    this.type = props.type
    this.status = props.status
    this.scheduledDate = props.scheduledDate
    this.completedAt = props.completedAt ?? null
    this.downtimeHours = props.downtimeHours ?? 0
    this.downtimeCostPerHour = props.downtimeCostPerHour ?? 0
    this.totalPartsCost = props.totalPartsCost ?? 0
    this.totalLaborCost = props.totalLaborCost ?? 0
    this.totalDowntimeCost = props.totalDowntimeCost ?? 0
    this.totalCost = props.totalCost ?? 0
    this.executedItems = Object.freeze([...(props.executedItems ?? [])])

    Object.freeze(this)
  }

  static create(
    tenantId: string,
    vehicleId: string,
    providerId: string,
    type: MaintenanceOrderType,
    scheduledDate: Date,
    id = crypto.randomUUID(),
  ): MaintenanceOrderEntity {
    return new MaintenanceOrderEntity({
      id,
      tenantId,
      vehicleId,
      providerId,
      type,
      status: 'OPEN',
      scheduledDate,
      completedAt: null,
      downtimeHours: 0,
      downtimeCostPerHour: 0,
      totalPartsCost: 0,
      totalLaborCost: 0,
      totalDowntimeCost: 0,
      totalCost: 0,
      executedItems: [],
    })
  }

  complete(params: {
    downtimeHours: number
    downtimeCostPerHour: number
    executedItems: ReadonlyArray<MaintenanceOrderItem>
    completedAt?: Date
  }): MaintenanceOrderEntity {
    if (this.status === 'COMPLETED') {
      throw new Error('A ordem de serviço já foi concluída anteriormente')
    }
    if (params.downtimeHours < 0) {
      throw new Error('Horas de indisponibilidade não podem ser negativas')
    }
    if (params.downtimeCostPerHour < 0) {
      throw new Error('Custo de indisponibilidade por hora não pode ser negativo')
    }

    for (const item of params.executedItems) {
      if (item.partCost < 0 || item.laborCost < 0) {
        throw new Error('Custos de peças e mão de obra não podem ser negativos')
      }
    }

    const totalPartsCost = Number(
      params.executedItems.reduce((acc, item) => acc + item.partCost, 0).toFixed(2),
    )
    const totalLaborCost = Number(
      params.executedItems.reduce((acc, item) => acc + item.laborCost, 0).toFixed(2),
    )
    const totalDowntimeCost = Number((params.downtimeHours * params.downtimeCostPerHour).toFixed(2))
    const totalCost = Number((totalPartsCost + totalLaborCost + totalDowntimeCost).toFixed(2))

    return new MaintenanceOrderEntity({
      id: this.id,
      tenantId: this.tenantId,
      vehicleId: this.vehicleId,
      providerId: this.providerId,
      type: this.type,
      status: 'COMPLETED',
      scheduledDate: this.scheduledDate,
      completedAt: params.completedAt ?? new Date(),
      downtimeHours: params.downtimeHours,
      downtimeCostPerHour: params.downtimeCostPerHour,
      totalPartsCost,
      totalLaborCost,
      totalDowntimeCost,
      totalCost,
      executedItems: params.executedItems,
    })
  }
}

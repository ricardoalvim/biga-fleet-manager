import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  MaintenancePlanDocument,
  type MaintenancePlanItemSubdocument,
} from '../schemas/maintenance-plan.document.js'
import {
  MaintenanceOrderDocument,
  type MaintenanceOrderItemSubdocument,
} from '../schemas/maintenance-order.document.js'
import {
  MaintenancePlanInternalDto,
  MaintenancePlanItemDto,
} from '../dtos/internal/maintenance-plan.internal.dto.js'
import type { CreateMaintenancePlanInternalDto } from '../dtos/internal/create-maintenance-plan.internal.dto.js'
import {
  MaintenanceOrderInternalDto,
  MaintenanceOrderItemDto,
} from '../dtos/internal/maintenance-order.internal.dto.js'
import type { CreateMaintenanceOrderInternalDto } from '../dtos/internal/create-maintenance-order.internal.dto.js'
import type { CompleteMaintenanceOrderInternalDto } from '../dtos/internal/complete-maintenance-order.internal.dto.js'

export interface MaintenanceOrderFilterOptions {
  readonly vehicleId?: string
  readonly providerId?: string
  readonly status?: string
}

interface RawPlanRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly name: string
  readonly triggerKm: number
  readonly items: ReadonlyArray<MaintenancePlanItemSubdocument>
  readonly createdAt: Date
}

interface RawOrderRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly vehicleId: string
  readonly providerId: string
  readonly type: 'PREVENTIVE' | 'CORRECTIVE'
  readonly status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  readonly scheduledDate: Date
  readonly completedAt?: Date | null
  readonly downtimeHours: number
  readonly downtimeCostPerHour: number
  readonly totalPartsCost: number
  readonly totalLaborCost: number
  readonly totalDowntimeCost: number
  readonly totalCost: number
  readonly executedItems: ReadonlyArray<MaintenanceOrderItemSubdocument>
  readonly createdAt: Date
}

@Injectable()
export class MaintenanceRepository {
  constructor(
    @InjectModel(MaintenancePlanDocument.name)
    private readonly planModel: Model<MaintenancePlanDocument>,
    @InjectModel(MaintenanceOrderDocument.name)
    private readonly orderModel: Model<MaintenanceOrderDocument>,
  ) {}

  async createPlan(
    dto: Readonly<CreateMaintenancePlanInternalDto>,
  ): Promise<Readonly<MaintenancePlanInternalDto>> {
    const doc = await this.planModel.create({
      tenantId: dto.tenantId,
      name: dto.name,
      triggerKm: dto.triggerKm,
      items: dto.items.map((i) => ({
        description: i.description,
        action: i.action,
      })),
    })

    return this.mapPlanToDto(doc.toObject())
  }

  async findPlans(tenantId: string): Promise<ReadonlyArray<Readonly<MaintenancePlanInternalDto>>> {
    const docs = await this.planModel.find({ tenantId }).sort({ triggerKm: 1 }).lean()

    return Object.freeze(docs.map((d) => this.mapPlanToDto(d as unknown as RawPlanRecord)))
  }

  async findPlanById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<MaintenancePlanInternalDto> | null> {
    const doc = await this.planModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapPlanToDto(doc) : null
  }

  async createOrder(
    dto: Readonly<CreateMaintenanceOrderInternalDto>,
  ): Promise<Readonly<MaintenanceOrderInternalDto>> {
    const doc = await this.orderModel.create({
      tenantId: dto.tenantId,
      vehicleId: dto.vehicleId,
      providerId: dto.providerId,
      type: dto.type,
      status: 'OPEN',
      scheduledDate: new Date(dto.scheduledDate),
      downtimeHours: 0,
      downtimeCostPerHour: 0,
      totalPartsCost: 0,
      totalLaborCost: 0,
      totalDowntimeCost: 0,
      totalCost: 0,
      executedItems: [],
    })

    return this.mapOrderToDto(doc.toObject())
  }

  async findOrderById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<MaintenanceOrderInternalDto> | null> {
    const doc = await this.orderModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapOrderToDto(doc) : null
  }

  async findOrders(
    tenantId: string,
    filters?: MaintenanceOrderFilterOptions,
  ): Promise<ReadonlyArray<Readonly<MaintenanceOrderInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.vehicleId) query.vehicleId = filters.vehicleId
    if (filters?.providerId) query.providerId = filters.providerId
    if (filters?.status) query.status = filters.status

    const docs = await this.orderModel.find(query).sort({ scheduledDate: -1 }).lean()

    return Object.freeze(docs.map((d) => this.mapOrderToDto(d as unknown as RawOrderRecord)))
  }

  async completeOrder(
    dto: Readonly<CompleteMaintenanceOrderInternalDto>,
    calculated: {
      readonly totalPartsCost: number
      readonly totalLaborCost: number
      readonly totalDowntimeCost: number
      readonly totalCost: number
      readonly completedAt: string
    },
  ): Promise<Readonly<MaintenanceOrderInternalDto> | null> {
    const updated = await this.orderModel
      .findOneAndUpdate(
        { _id: dto.orderId, tenantId: dto.tenantId },
        {
          $set: {
            status: 'COMPLETED',
            completedAt: new Date(calculated.completedAt),
            downtimeHours: dto.downtimeHours,
            downtimeCostPerHour: dto.downtimeCostPerHour,
            totalPartsCost: calculated.totalPartsCost,
            totalLaborCost: calculated.totalLaborCost,
            totalDowntimeCost: calculated.totalDowntimeCost,
            totalCost: calculated.totalCost,
            executedItems: dto.executedItems.map((i) => ({
              description: i.description,
              action: i.action,
              partCost: i.partCost,
              laborCost: i.laborCost,
            })),
          },
        },
        { new: true },
      )
      .lean()

    return updated ? this.mapOrderToDto(updated) : null
  }

  private mapPlanToDto(raw: RawPlanRecord): Readonly<MaintenancePlanInternalDto> {
    return new MaintenancePlanInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      name: raw.name,
      triggerKm: raw.triggerKm,
      items: (raw.items || []).map(
        (i) =>
          new MaintenancePlanItemDto({
            description: i.description,
            action: i.action,
          }),
      ),
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    })
  }

  private mapOrderToDto(raw: RawOrderRecord): Readonly<MaintenanceOrderInternalDto> {
    return new MaintenanceOrderInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      vehicleId: raw.vehicleId,
      providerId: raw.providerId,
      type: raw.type,
      status: raw.status,
      scheduledDate:
        raw.scheduledDate instanceof Date
          ? raw.scheduledDate.toISOString()
          : String(raw.scheduledDate),
      completedAt: raw.completedAt
        ? raw.completedAt instanceof Date
          ? raw.completedAt.toISOString()
          : String(raw.completedAt)
        : null,
      downtimeHours: raw.downtimeHours,
      downtimeCostPerHour: raw.downtimeCostPerHour,
      totalPartsCost: raw.totalPartsCost,
      totalLaborCost: raw.totalLaborCost,
      totalDowntimeCost: raw.totalDowntimeCost,
      totalCost: raw.totalCost,
      executedItems: (raw.executedItems || []).map(
        (i) =>
          new MaintenanceOrderItemDto({
            description: i.description,
            action: i.action,
            partCost: i.partCost,
            laborCost: i.laborCost,
          }),
      ),
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    })
  }
}

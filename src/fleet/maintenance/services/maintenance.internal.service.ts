import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../../platform/persistence/prisma.service.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import { MaintenancePlanEntity } from '../entities/maintenance-plan.entity.js'
import { MaintenanceOrderEntity } from '../entities/maintenance-order.entity.js'
import { CreateMaintenancePlanInternalDto } from '../dtos/internal/create-maintenance-plan.internal.dto.js'
import {
  MaintenancePlanInternalDto,
  MaintenancePlanItemDto,
} from '../dtos/internal/maintenance-plan.internal.dto.js'
import { CreateMaintenanceOrderInternalDto } from '../dtos/internal/create-maintenance-order.internal.dto.js'
import { CompleteMaintenanceOrderInternalDto } from '../dtos/internal/complete-maintenance-order.internal.dto.js'
import {
  MaintenanceOrderInternalDto,
  MaintenanceOrderItemDto,
} from '../dtos/internal/maintenance-order.internal.dto.js'
import {
  PredictiveSuggestionDto,
  type PredictiveSuggestionStatus,
  VehicleMaintenanceSuggestionsDto,
} from '../dtos/internal/predictive-suggestion.internal.dto.js'
import type { CreateMaintenancePlanDto } from '../dtos/external/create-maintenance-plan.dto.js'
import type { CreateMaintenanceOrderDto } from '../dtos/external/create-maintenance-order.dto.js'
import type { CompleteMaintenanceOrderDto } from '../dtos/external/complete-maintenance-order.dto.js'
import {
  MaintenanceRepository,
  type MaintenanceOrderFilterOptions,
} from '../repositories/maintenance.repository.js'
import { MaintenanceExternalService } from './maintenance.external.service.js'

@Injectable()
export class MaintenanceInternalService {
  constructor(
    private readonly repository: MaintenanceRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly prisma: PrismaService,
    private readonly externalService: MaintenanceExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  async createPlan(
    dto: CreateMaintenancePlanDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<MaintenancePlanInternalDto>> {
    const entity = new MaintenancePlanEntity({
      id: crypto.randomUUID(),
      tenantId,
      name: dto.name,
      triggerKm: dto.triggerKm,
      items: dto.items,
    })

    const internalDto = new CreateMaintenancePlanInternalDto({
      tenantId,
      name: entity.name,
      triggerKm: entity.triggerKm,
      items: entity.items.map(
        (i) =>
          new MaintenancePlanItemDto({
            description: i.description,
            action: i.action,
          }),
      ),
    })

    return this.repository.createPlan(internalDto)
  }

  async findPlans(
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<MaintenancePlanInternalDto>>> {
    return this.repository.findPlans(tenantId)
  }

  async createOrder(
    dto: CreateMaintenanceOrderDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<MaintenanceOrderInternalDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, dto.vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant especificado', {
        errorCode: 'FLEET-0007',
      })
    }

    const provider = await this.prisma.orm.Company.where({
      id: dto.providerId,
      tenantId,
    }).first()

    if (!provider) {
      throw new NotFoundException('Empresa prestadora de serviço não encontrada', {
        errorCode: 'FLEET-0005',
      })
    }

    if (provider.type !== 'MAINTENANCE') {
      throw new BadRequestException('A empresa prestadora deve ser do tipo MAINTENANCE', {
        errorCode: 'FLEET-0009',
      })
    }

    const entity = MaintenanceOrderEntity.create(
      tenantId,
      dto.vehicleId,
      dto.providerId,
      dto.type,
      new Date(dto.scheduledDate),
    )

    const internalDto = new CreateMaintenanceOrderInternalDto({
      tenantId,
      vehicleId: entity.vehicleId,
      providerId: entity.providerId,
      type: entity.type,
      scheduledDate: entity.scheduledDate.toISOString(),
    })

    const created = await this.repository.createOrder(internalDto)
    void this.externalService.notifyOrderCreated(created)
    return created
  }

  async completeOrder(
    id: string,
    dto: CompleteMaintenanceOrderDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<MaintenanceOrderInternalDto>> {
    const order = await this.repository.findOrderById(tenantId, id)
    if (!order) {
      throw new NotFoundException('Ordem de manutenção não encontrada', {
        errorCode: 'FLEET-0010',
      })
    }

    if (order.status === 'COMPLETED') {
      throw new ConflictException('Ordem de manutenção já foi concluída anteriormente', {
        errorCode: 'FLEET-0011',
      })
    }

    const entity = new MaintenanceOrderEntity({
      id: order.id,
      tenantId: order.tenantId,
      vehicleId: order.vehicleId,
      providerId: order.providerId,
      type: order.type,
      status: order.status,
      scheduledDate: new Date(order.scheduledDate),
      downtimeHours: order.downtimeHours,
      downtimeCostPerHour: order.downtimeCostPerHour,
      totalPartsCost: order.totalPartsCost,
      totalLaborCost: order.totalLaborCost,
      totalDowntimeCost: order.totalDowntimeCost,
      totalCost: order.totalCost,
    })

    const completedEntity = entity.complete({
      downtimeHours: dto.downtimeHours,
      downtimeCostPerHour: dto.downtimeCostPerHour,
      executedItems: dto.executedItems.map((item) => ({
        description: item.description,
        action: item.action,
        partCost: item.partCost,
        laborCost: item.laborCost,
      })),
    })

    const completeDto = new CompleteMaintenanceOrderInternalDto({
      orderId: id,
      tenantId,
      downtimeHours: completedEntity.downtimeHours,
      downtimeCostPerHour: completedEntity.downtimeCostPerHour,
      executedItems: completedEntity.executedItems.map(
        (i) =>
          new MaintenanceOrderItemDto({
            description: i.description,
            action: i.action,
            partCost: i.partCost,
            laborCost: i.laborCost,
          }),
      ),
      completedAt: completedEntity.completedAt?.toISOString(),
    })

    const updated = await this.repository.completeOrder(completeDto, {
      totalPartsCost: completedEntity.totalPartsCost,
      totalLaborCost: completedEntity.totalLaborCost,
      totalDowntimeCost: completedEntity.totalDowntimeCost,
      totalCost: completedEntity.totalCost,
      completedAt: completedEntity.completedAt?.toISOString() || new Date().toISOString(),
    })

    if (!updated) {
      throw new NotFoundException('Falha ao atualizar ordem de manutenção', {
        errorCode: 'FLEET-0010',
      })
    }

    void this.externalService.notifyOrderCompleted(updated)
    return updated
  }

  async findOrderById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<MaintenanceOrderInternalDto>> {
    const order = await this.repository.findOrderById(tenantId, id)
    if (!order) {
      throw new NotFoundException('Ordem de manutenção não encontrada', {
        errorCode: 'FLEET-0010',
      })
    }

    return order
  }

  async findOrders(
    filters?: MaintenanceOrderFilterOptions,
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<MaintenanceOrderInternalDto>>> {
    return this.repository.findOrders(tenantId, filters)
  }

  async getPredictiveSuggestions(
    vehicleId: string,
    currentKmOverride?: number,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<VehicleMaintenanceSuggestionsDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant especificado', {
        errorCode: 'FLEET-0007',
      })
    }

    let currentKm = currentKmOverride
    if (currentKm === undefined) {
      const trips = await this.prisma.orm.Trip.where({ tenantId, vehicleId }).all()
      currentKm = Number(trips.reduce((acc, t) => acc + (t.distanceKm || 0), 0).toFixed(2))
    }

    const plans = await this.repository.findPlans(tenantId)

    const suggestions = plans.map((plan) => {
      const kmDifference = Number((currentKm - plan.triggerKm).toFixed(2))
      let status: PredictiveSuggestionStatus = 'UPCOMING'

      if (kmDifference >= 1000) {
        status = 'OVERDUE'
      } else if (kmDifference >= 0) {
        status = 'DUE'
      }

      return new PredictiveSuggestionDto({
        planId: plan.id,
        planName: plan.name,
        triggerKm: plan.triggerKm,
        currentKm: currentKm,
        kmDifference,
        status,
        items: plan.items,
      })
    })

    return new VehicleMaintenanceSuggestionsDto({
      vehicleId,
      vehiclePlate: vehicle.plate,
      currentKm,
      suggestions,
    })
  }
}

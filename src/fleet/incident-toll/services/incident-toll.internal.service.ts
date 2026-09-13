import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../platform/persistence/prisma.service.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import { TollEventEntity } from '../entities/toll-event.entity.js'
import { IncidentEntity } from '../entities/incident.entity.js'
import { CreateTollEventInternalDto } from '../dtos/internal/create-toll-event.internal.dto.js'
import type { TollEventInternalDto } from '../dtos/internal/toll-event.internal.dto.js'
import { CreateIncidentInternalDto } from '../dtos/internal/create-incident.internal.dto.js'
import { SettleIncidentInternalDto } from '../dtos/internal/settle-incident.internal.dto.js'
import type { IncidentInternalDto } from '../dtos/internal/incident.internal.dto.js'
import { VehicleFinancialSummaryDto } from '../dtos/internal/vehicle-financial-summary.internal.dto.js'
import type { CreateTollEventDto } from '../dtos/external/create-toll-event.dto.js'
import type { CreateIncidentDto } from '../dtos/external/create-incident.dto.js'
import type { SettleIncidentDto } from '../dtos/external/settle-incident.dto.js'
import {
  IncidentTollRepository,
  type TollFilterOptions,
  type IncidentFilterOptions,
} from '../repositories/incident-toll.repository.js'
import { IncidentTollExternalService } from './incident-toll.external.service.js'

@Injectable()
export class IncidentTollInternalService {
  constructor(
    private readonly repository: IncidentTollRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly prisma: PrismaService,
    private readonly externalService: IncidentTollExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  async registerTollEvent(
    dto: CreateTollEventDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TollEventInternalDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, dto.vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant informado', {
        errorCode: 'FLEET-0007',
      })
    }

    const existing = await this.repository.findTollByExternalId(tenantId, dto.externalTransactionId)
    if (existing) {
      throw new ConflictException('Transação de pedágio já registrada para este tenant', {
        errorCode: 'FLEET-0012',
      })
    }

    const entity = new TollEventEntity({
      id: crypto.randomUUID(),
      tenantId,
      vehicleId: dto.vehicleId,
      tollPlazaName: dto.tollPlazaName,
      externalTransactionId: dto.externalTransactionId,
      amount: dto.amount,
      passedAt: new Date(dto.passedAt),
    })

    const internalDto = new CreateTollEventInternalDto({
      tenantId,
      vehicleId: entity.vehicleId,
      tollPlazaName: entity.tollPlazaName,
      externalTransactionId: entity.externalTransactionId,
      amount: entity.amount,
      passedAt: entity.passedAt.toISOString(),
    })

    const created = await this.repository.createTollEvent(internalDto)
    void this.externalService.notifyTollEvent(created)
    return created
  }

  async findTolls(
    filters?: TollFilterOptions,
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<TollEventInternalDto>>> {
    return this.repository.findTolls(tenantId, filters)
  }

  async registerIncident(
    dto: CreateIncidentDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<IncidentInternalDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, dto.vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant informado', {
        errorCode: 'FLEET-0007',
      })
    }

    const company = await this.prisma.orm.Company.where({
      id: dto.responsibleCompanyId,
      tenantId,
    }).first()

    if (!company) {
      throw new NotFoundException('Empresa responsável não encontrada no tenant', {
        errorCode: 'FLEET-0005',
      })
    }

    const entity = IncidentEntity.create(
      tenantId,
      dto.vehicleId,
      dto.responsibleCompanyId,
      dto.incidentType,
      dto.description,
      dto.estimatedCost,
      new Date(dto.occurredAt),
    )

    const internalDto = new CreateIncidentInternalDto({
      tenantId,
      vehicleId: entity.vehicleId,
      responsibleCompanyId: entity.responsibleCompanyId,
      incidentType: entity.incidentType,
      description: entity.description,
      estimatedCost: entity.estimatedCost,
      occurredAt: entity.occurredAt.toISOString(),
    })

    const created = await this.repository.createIncident(internalDto)
    void this.externalService.notifyIncident(created)
    return created
  }

  async findIncidents(
    filters?: IncidentFilterOptions,
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<IncidentInternalDto>>> {
    return this.repository.findIncidents(tenantId, filters)
  }

  async findIncidentById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<IncidentInternalDto>> {
    const incident = await this.repository.findIncidentById(tenantId, id)
    if (!incident) {
      throw new NotFoundException('Sinistro ou ocorrência não encontrada', {
        errorCode: 'FLEET-0013',
      })
    }

    return incident
  }

  async settleIncident(
    id: string,
    dto: SettleIncidentDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<IncidentInternalDto>> {
    const incident = await this.repository.findIncidentById(tenantId, id)
    if (!incident) {
      throw new NotFoundException('Sinistro ou ocorrência não encontrada', {
        errorCode: 'FLEET-0013',
      })
    }

    if (incident.status === 'SETTLED') {
      throw new ConflictException('Ocorrência já foi liquidada anteriormente', {
        errorCode: 'FLEET-0014',
      })
    }

    const entity = new IncidentEntity({
      id: incident.id,
      tenantId: incident.tenantId,
      vehicleId: incident.vehicleId,
      responsibleCompanyId: incident.responsibleCompanyId,
      incidentType: incident.incidentType,
      description: incident.description,
      estimatedCost: incident.estimatedCost,
      actualCost: incident.actualCost,
      status: incident.status,
      occurredAt: new Date(incident.occurredAt),
      settledAt: incident.settledAt ? new Date(incident.settledAt) : null,
    })

    const settledEntity = entity.settle(dto.actualCost)

    const internalDto = new SettleIncidentInternalDto({
      incidentId: id,
      tenantId,
      actualCost: settledEntity.actualCost!,
      settledAt: settledEntity.settledAt?.toISOString(),
    })

    const updated = await this.repository.settleIncident(internalDto)
    if (!updated) {
      throw new NotFoundException('Falha ao liquidar ocorrência', {
        errorCode: 'FLEET-0013',
      })
    }

    void this.externalService.notifyIncidentSettled(updated)
    return updated
  }

  async getVehicleFinancialSummary(
    vehicleId: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<VehicleFinancialSummaryDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant informado', {
        errorCode: 'FLEET-0007',
      })
    }

    const tollStats = await this.repository.getVehicleTollsSum(tenantId, vehicleId)
    const incidentStats = await this.repository.getVehicleIncidentsSum(tenantId, vehicleId)
    const totalCombinedCost = Number((tollStats.totalAmount + incidentStats.totalActual).toFixed(2))

    return new VehicleFinancialSummaryDto({
      vehicleId,
      vehiclePlate: vehicle.plate,
      totalTollAmount: tollStats.totalAmount,
      tollPassageCount: tollStats.count,
      totalEstimatedIncidentCost: incidentStats.totalEstimated,
      totalActualIncidentCost: incidentStats.totalActual,
      incidentCount: incidentStats.count,
      totalCombinedCost,
    })
  }
}

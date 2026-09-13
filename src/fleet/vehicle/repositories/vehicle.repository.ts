import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../platform/persistence/prisma.service.js'
import {
  VehicleCompanySummaryDto,
  VehicleInternalDto,
} from '../dtos/internal/vehicle.internal.dto.js'
import type { CreateVehicleInternalDto } from '../dtos/internal/create-vehicle.internal.dto.js'

export interface VehicleFilterOptions {
  readonly ownerId?: string
  readonly contractorId?: string
  readonly custodianId?: string
}

interface RawCompanyRelation {
  readonly id: string
  readonly name: string
  readonly type: string
}

interface RawVehicleRecord {
  readonly id: string
  readonly tenantId: string
  readonly plate: string
  readonly model: string
  readonly ownerId: string
  readonly contractorId: string
  readonly custodianId: string
  readonly createdAt: string
  readonly owner?: RawCompanyRelation | null
  readonly contractor?: RawCompanyRelation | null
  readonly custodian?: RawCompanyRelation | null
}

@Injectable()
export class VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Readonly<CreateVehicleInternalDto>): Promise<Readonly<VehicleInternalDto>> {
    const record = await this.prisma.orm.Vehicle.create({
      tenantId: dto.tenantId,
      plate: dto.plate,
      model: dto.model,
      ownerId: dto.ownerId,
      contractorId: dto.contractorId,
      custodianId: dto.custodianId,
    })

    return this.mapToInternalDto(record)
  }

  async findByPlate(tenantId: string, plate: string): Promise<Readonly<VehicleInternalDto> | null> {
    const record = await this.prisma.orm.Vehicle.where({ tenantId, plate })
      .include('owner')
      .include('contractor')
      .include('custodian')
      .first()

    return record ? this.mapToInternalDto(record) : null
  }

  async findById(tenantId: string, id: string): Promise<Readonly<VehicleInternalDto> | null> {
    const record = await this.prisma.orm.Vehicle.where({ id, tenantId })
      .include('owner')
      .include('contractor')
      .include('custodian')
      .first()

    return record ? this.mapToInternalDto(record) : null
  }

  async findAll(
    tenantId: string,
    filters?: VehicleFilterOptions,
  ): Promise<ReadonlyArray<Readonly<VehicleInternalDto>>> {
    const whereClause: Record<string, string> = { tenantId }
    if (filters?.ownerId) whereClause.ownerId = filters.ownerId
    if (filters?.contractorId) whereClause.contractorId = filters.contractorId
    if (filters?.custodianId) whereClause.custodianId = filters.custodianId

    const records = await this.prisma.orm.Vehicle.where(whereClause)
      .include('owner')
      .include('contractor')
      .include('custodian')
      .orderBy((v) => v.plate.asc())
      .all()

    return Object.freeze(records.map((r) => this.mapToInternalDto(r)))
  }

  async validateCompaniesExist(
    tenantId: string,
    companyIds: ReadonlyArray<string>,
  ): Promise<boolean> {
    const uniqueIds = Array.from(new Set(companyIds))
    const existing = await this.prisma.orm.Company.where({ tenantId }).all()
    const existingIdSet = new Set(existing.map((c) => c.id))

    return uniqueIds.every((id) => existingIdSet.has(id))
  }

  private mapToInternalDto(raw: RawVehicleRecord): Readonly<VehicleInternalDto> {
    return new VehicleInternalDto({
      id: raw.id,
      tenantId: raw.tenantId,
      plate: raw.plate,
      model: raw.model,
      ownerId: raw.ownerId,
      contractorId: raw.contractorId,
      custodianId: raw.custodianId,
      createdAt: raw.createdAt,
      owner: raw.owner
        ? new VehicleCompanySummaryDto({
            id: raw.owner.id,
            name: raw.owner.name,
            type: raw.owner.type,
          })
        : undefined,
      contractor: raw.contractor
        ? new VehicleCompanySummaryDto({
            id: raw.contractor.id,
            name: raw.contractor.name,
            type: raw.contractor.type,
          })
        : undefined,
      custodian: raw.custodian
        ? new VehicleCompanySummaryDto({
            id: raw.custodian.id,
            name: raw.custodian.name,
            type: raw.custodian.type,
          })
        : undefined,
    })
  }
}

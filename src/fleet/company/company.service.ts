import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../platform/persistence/prisma.service.js'
import { TenantContext } from '../../tenancy/tenant.context.js'
import type { CreateCompanyInput } from './schemas/create-company.schema.js'

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateCompanyInput) {
    const tenantId = dto.tenantId ?? this.tenant.tenantId
    const existing = await this.prisma.orm.Company.where({ tenantId, taxId: dto.taxId }).first()

    if (existing) {
      throw new ConflictException('Uma empresa com este documento já existe', {
        errorCode: 'FLEET-0001',
      })
    }

    return this.prisma.orm.Company.create({
      name: dto.name,
      taxId: dto.taxId,
      type: dto.type,
      tenantId,
    })
  }

  findAll(type?: 'CLIENT' | 'RENTAL' | 'MAINTENANCE') {
    const tenantId = this.tenant.tenantId
    if (type) {
      return this.prisma.orm.Company.where({ tenantId, type })
        .orderBy((company) => company.name.asc())
        .all()
    }
    return this.prisma.orm.Company.where({ tenantId })
      .orderBy((company) => company.name.asc())
      .all()
  }

  async findById(id: string) {
    const tenantId = this.tenant.tenantId
    const company = await this.prisma.orm.Company.where({ id, tenantId })
      .include('ownedVehicles')
      .include('contractedVehicles')
      .include('custodiedVehicles')
      .first()

    if (!company) {
      throw new NotFoundException('Empresa não encontrada', {
        errorCode: 'FLEET-0005',
      })
    }

    return company
  }
}

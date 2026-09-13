import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../platform/persistence/prisma.service.js'
import type { CreateTenantInput } from './schemas/create-tenant.schema.js'

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  resolve(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug)

    return isUuid
      ? this.prisma.orm.Tenant.where({ id: idOrSlug }).first()
      : this.prisma.orm.Tenant.where({ slug: idOrSlug }).first()
  }

  async create(input: CreateTenantInput) {
    const existing = await this.prisma.orm.Tenant.where({ slug: input.slug }).first()
    if (existing) {
      throw new ConflictException('Tenant slug already exists', { errorCode: 'TENANT-0004' })
    }

    return this.prisma.orm.Tenant.create(input)
  }

  findAll() {
    return this.prisma.orm.Tenant.orderBy((tenant) => tenant.name.asc()).all()
  }
}

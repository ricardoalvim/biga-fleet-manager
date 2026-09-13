import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ConflictException } from '@nestjs/common'
import { TenantService } from './tenant.service.js'
import type { PrismaService } from '../platform/persistence/prisma.service.js'

describe('TenantService', () => {
  let service: TenantService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = {
      orm: {
        Tenant: {
          where: vi.fn(),
          create: vi.fn(),
          orderBy: vi.fn(),
        },
      },
    }

    service = new TenantService(mockPrisma as PrismaService)
  })

  it('deve resolver tenant por UUID quando fornecido formato UUID válido', async () => {
    const validUuid = '00000000-0000-4000-8000-000000000001'
    const expected = { id: validUuid, slug: 'matriz' }

    mockPrisma.orm.Tenant.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(expected),
    })

    const result = await service.resolve(validUuid)

    expect(mockPrisma.orm.Tenant.where).toHaveBeenCalledWith({ id: validUuid })
    expect(result).toEqual(expected)
  })

  it('deve resolver tenant por Slug quando fornecido slug legível', async () => {
    const slug = 'locadora-sp'
    const expected = { id: 'uuid-123', slug }

    mockPrisma.orm.Tenant.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(expected),
    })

    const result = await service.resolve(slug)

    expect(mockPrisma.orm.Tenant.where).toHaveBeenCalledWith({ slug })
    expect(result).toEqual(expected)
  })

  it('deve criar novo tenant quando slug não existir', async () => {
    mockPrisma.orm.Tenant.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    })

    const newTenant = { id: 'new-id', slug: 'locadora-rio', name: 'Locadora Rio' }
    mockPrisma.orm.Tenant.create.mockResolvedValue(newTenant)

    const result = await service.create({
      slug: 'locadora-rio',
      name: 'Locadora Rio',
    })

    expect(result).toEqual(newTenant)
    expect(mockPrisma.orm.Tenant.create).toHaveBeenCalledWith({
      slug: 'locadora-rio',
      name: 'Locadora Rio',
    })
  })

  it('deve lançar ConflictException quando slug já estiver em uso', async () => {
    mockPrisma.orm.Tenant.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 'existing', slug: 'locadora-rio' }),
    })

    await expect(
      service.create({
        slug: 'locadora-rio',
        name: 'Locadora Rio',
      }),
    ).rejects.toThrow(ConflictException)

    expect(mockPrisma.orm.Tenant.create).not.toHaveBeenCalled()
  })
})

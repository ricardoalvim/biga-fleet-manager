import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { CompanyService } from './company.service.js'
import type { PrismaService } from '../../platform/persistence/prisma.service.js'
import type { TenantContext } from '../../tenancy/tenant.context.js'

describe('CompanyService', () => {
  let service: CompanyService
  let mockPrisma: any
  let mockTenant: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    mockTenant = {
      tenantId,
    }

    mockPrisma = {
      orm: {
        Company: {
          where: vi.fn(),
          create: vi.fn(),
        },
      },
    }

    service = new CompanyService(mockPrisma as PrismaService, mockTenant as TenantContext)
  })

  it('deve criar uma nova empresa com sucesso associada ao tenant padrão', async () => {
    mockPrisma.orm.Company.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    })

    const newCompany = {
      id: 'company-1',
      name: 'Oficina do Vulcano Ltda',
      taxId: '12345678000199',
      type: 'MAINTENANCE' as const,
      tenantId,
      createdAt: new Date().toISOString(),
    }

    mockPrisma.orm.Company.create.mockResolvedValue(newCompany)

    const result = await service.create({
      name: 'Oficina do Vulcano Ltda',
      taxId: '12345678000199',
      type: 'MAINTENANCE',
    })

    expect(result).toEqual(newCompany)
    expect(mockPrisma.orm.Company.where).toHaveBeenCalledWith({
      tenantId,
      taxId: '12345678000199',
    })
    expect(mockPrisma.orm.Company.create).toHaveBeenCalledWith({
      name: 'Oficina do Vulcano Ltda',
      taxId: '12345678000199',
      type: 'MAINTENANCE',
      tenantId,
    })
  })

  it('deve permitir criar empresa especificando tenantId explicitamente no payload', async () => {
    const explicitTenant = '00000000-0000-4000-8000-000000000099'

    mockPrisma.orm.Company.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    })

    const createdCompany = {
      id: 'company-2',
      tenantId: explicitTenant,
      name: 'Locadora Roma',
      taxId: '98765432000188',
      type: 'RENTAL' as const,
      createdAt: new Date().toISOString(),
    }

    mockPrisma.orm.Company.create.mockResolvedValue(createdCompany)

    const result = await service.create({
      tenantId: explicitTenant,
      name: 'Locadora Roma',
      taxId: '98765432000188',
      type: 'RENTAL',
    })

    expect(result).toEqual(createdCompany)
    expect(mockPrisma.orm.Company.where).toHaveBeenCalledWith({
      tenantId: explicitTenant,
      taxId: '98765432000188',
    })
    expect(mockPrisma.orm.Company.create).toHaveBeenCalledWith({
      name: 'Locadora Roma',
      taxId: '98765432000188',
      type: 'RENTAL',
      tenantId: explicitTenant,
    })
  })

  it('deve lançar ConflictException caso o taxId já exista no tenant', async () => {
    mockPrisma.orm.Company.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 'existing-id', taxId: '12345678000199' }),
    })

    await expect(
      service.create({
        name: 'Oficina do Vulcano Ltda',
        taxId: '12345678000199',
        type: 'MAINTENANCE',
      }),
    ).rejects.toThrow(ConflictException)

    expect(mockPrisma.orm.Company.create).not.toHaveBeenCalled()
  })

  it('deve listar todas as empresas filtrando por tenantId em ordem alfabética', async () => {
    const list = [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ]
    const allMock = vi.fn().mockResolvedValue(list)
    const orderByMock = vi.fn().mockReturnValue({ all: allMock })

    mockPrisma.orm.Company.where.mockReturnValue({
      orderBy: orderByMock,
    })

    const result = await service.findAll()

    expect(mockPrisma.orm.Company.where).toHaveBeenCalledWith({ tenantId })
    expect(result).toEqual(list)
  })

  it('deve listar empresas filtrando por type quando fornecido', async () => {
    const list = [{ id: '1', name: 'Oficina Vulcano', type: 'MAINTENANCE' }]
    const allMock = vi.fn().mockResolvedValue(list)
    const orderByMock = vi.fn().mockReturnValue({ all: allMock })

    mockPrisma.orm.Company.where.mockReturnValue({
      orderBy: orderByMock,
    })

    const result = await service.findAll('MAINTENANCE')

    expect(mockPrisma.orm.Company.where).toHaveBeenCalledWith({ tenantId, type: 'MAINTENANCE' })
    expect(result).toEqual(list)
  })

  it('deve buscar empresa por ID incluindo relacionamentos veiculares', async () => {
    const company = {
      id: 'comp-1',
      name: 'Vulcano',
      ownedVehicles: [],
      contractedVehicles: [],
      custodiedVehicles: [{ id: 'v-1', plate: 'ROM1001' }],
    }

    const firstMock = vi.fn().mockResolvedValue(company)
    const custMock = { first: firstMock }
    const contMock = { include: vi.fn().mockReturnValue(custMock) }
    const ownedMock = { include: vi.fn().mockReturnValue(contMock) }

    mockPrisma.orm.Company.where.mockReturnValue({
      include: vi.fn().mockReturnValue(ownedMock),
    })

    const result = await service.findById('comp-1')

    expect(mockPrisma.orm.Company.where).toHaveBeenCalledWith({ id: 'comp-1', tenantId })
    expect(result).toEqual(company)
  })

  it('deve lançar NotFoundException ao buscar empresa inexistente', async () => {
    const firstMock = vi.fn().mockResolvedValue(null)
    const custMock = { first: firstMock }
    const contMock = { include: vi.fn().mockReturnValue(custMock) }
    const ownedMock = { include: vi.fn().mockReturnValue(contMock) }

    mockPrisma.orm.Company.where.mockReturnValue({
      include: vi.fn().mockReturnValue(ownedMock),
    })

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException)
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { VehicleInternalService } from './vehicle.internal.service.js'
import { VehicleInternalDto } from '../dtos/internal/vehicle.internal.dto.js'
import type { VehicleRepository } from '../repositories/vehicle.repository.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'

describe('VehicleInternalService', () => {
  let service: VehicleInternalService
  let mockRepo: any
  let mockTenant: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    mockTenant = { tenantId }

    mockRepo = {
      create: vi.fn(),
      findByPlate: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      validateCompaniesExist: vi.fn(),
    }

    service = new VehicleInternalService(mockRepo as VehicleRepository, mockTenant as TenantContext)
  })

  it('deve cadastrar um novo veículo com sucesso quando dados e parceiros forem válidos', async () => {
    mockRepo.findByPlate.mockResolvedValue(null)
    mockRepo.validateCompaniesExist.mockResolvedValue(true)

    const expected = new VehicleInternalDto({
      id: 'veh-1',
      tenantId,
      plate: 'ROM1001',
      model: 'Van Cargo',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
      createdAt: new Date().toISOString(),
    })

    mockRepo.create.mockResolvedValue(expected)

    const result = await service.create({
      plate: 'ROM1001',
      model: 'Van Cargo',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
    })

    expect(result).toEqual(expected)
    expect(mockRepo.findByPlate).toHaveBeenCalledWith(tenantId, 'ROM1001')
    expect(mockRepo.validateCompaniesExist).toHaveBeenCalledWith(tenantId, [
      'owner-1',
      'contractor-1',
      'custodian-1',
    ])
    expect(mockRepo.create).toHaveBeenCalled()
  })

  it('deve respeitar tenantId fornecido explicitamente no payload', async () => {
    const explicitTenant = '00000000-0000-4000-8000-000000000099'
    mockRepo.findByPlate.mockResolvedValue(null)
    mockRepo.validateCompaniesExist.mockResolvedValue(true)

    const expected = new VehicleInternalDto({
      id: 'veh-2',
      tenantId: explicitTenant,
      plate: 'ROM2002',
      model: 'Caminhão 3/4',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
      createdAt: new Date().toISOString(),
    })

    mockRepo.create.mockResolvedValue(expected)

    const result = await service.create({
      tenantId: explicitTenant,
      plate: 'ROM2002',
      model: 'Caminhão 3/4',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
    })

    expect(result.tenantId).toBe(explicitTenant)
    expect(mockRepo.findByPlate).toHaveBeenCalledWith(explicitTenant, 'ROM2002')
  })

  it('deve lançar ConflictException (FLEET-0002) se a placa já estiver registrada no tenant', async () => {
    mockRepo.findByPlate.mockResolvedValue(
      new VehicleInternalDto({
        id: 'existing',
        tenantId,
        plate: 'ROM1001',
        model: 'Van',
        ownerId: 'o',
        contractorId: 'c',
        custodianId: 'u',
        createdAt: '',
      }),
    )

    await expect(
      service.create({
        plate: 'ROM1001',
        model: 'Van Cargo',
        ownerId: 'owner-1',
        contractorId: 'contractor-1',
        custodianId: 'custodian-1',
      }),
    ).rejects.toThrow(ConflictException)

    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('deve lançar BadRequestException (FLEET-0006) se uma das empresas parceiras não pertencer ao tenant', async () => {
    mockRepo.findByPlate.mockResolvedValue(null)
    mockRepo.validateCompaniesExist.mockResolvedValue(false)

    await expect(
      service.create({
        plate: 'ROM1001',
        model: 'Van Cargo',
        ownerId: 'owner-externo',
        contractorId: 'contractor-1',
        custodianId: 'custodian-1',
      }),
    ).rejects.toThrow(BadRequestException)

    expect(mockRepo.create).not.toHaveBeenCalled()
  })

  it('deve rejeitar placas que violam os invariantes da entidade de domínio pura', async () => {
    await expect(
      service.create({
        plate: 'R', // inválida (< 5 caracteres)
        model: 'Van Cargo',
        ownerId: 'owner-1',
        contractorId: 'contractor-1',
        custodianId: 'custodian-1',
      }),
    ).rejects.toThrow('Placa inválida')
  })

  it('deve listar veículos no escopo do tenant com filtros opcionais', async () => {
    const list = [
      new VehicleInternalDto({
        id: 'v-1',
        tenantId,
        plate: 'ROM1001',
        model: 'Van',
        ownerId: 'owner-1',
        contractorId: 'c',
        custodianId: 'u',
        createdAt: '',
      }),
    ]

    mockRepo.findAll.mockResolvedValue(list)

    const result = await service.findAll({ ownerId: 'owner-1' })

    expect(mockRepo.findAll).toHaveBeenCalledWith(tenantId, { ownerId: 'owner-1' })
    expect(result).toEqual(list)
  })

  it('deve buscar veículo por ID no escopo do tenant', async () => {
    const vehicle = new VehicleInternalDto({
      id: 'v-1',
      tenantId,
      plate: 'ROM1001',
      model: 'Van',
      ownerId: 'o',
      contractorId: 'c',
      custodianId: 'u',
      createdAt: '',
    })

    mockRepo.findById.mockResolvedValue(vehicle)

    const result = await service.findById('v-1')

    expect(mockRepo.findById).toHaveBeenCalledWith(tenantId, 'v-1')
    expect(result).toEqual(vehicle)
  })

  it('deve lançar NotFoundException (FLEET-0007) quando veículo não for encontrado por ID', async () => {
    mockRepo.findById.mockResolvedValue(null)

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException)
  })

  it('deve buscar veículo por placa no escopo do tenant', async () => {
    const vehicle = new VehicleInternalDto({
      id: 'v-1',
      tenantId,
      plate: 'ROM1001',
      model: 'Van',
      ownerId: 'o',
      contractorId: 'c',
      custodianId: 'u',
      createdAt: '',
    })

    mockRepo.findByPlate.mockResolvedValue(vehicle)

    const result = await service.findByPlate('rom1001')

    expect(mockRepo.findByPlate).toHaveBeenCalledWith(tenantId, 'ROM1001')
    expect(result).toEqual(vehicle)
  })

  it('deve lançar NotFoundException (FLEET-0008) quando veículo não for encontrado por placa', async () => {
    mockRepo.findByPlate.mockResolvedValue(null)

    await expect(service.findByPlate('ROM9999')).rejects.toThrow(NotFoundException)
  })
})

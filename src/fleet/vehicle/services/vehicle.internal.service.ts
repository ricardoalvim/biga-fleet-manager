import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleEntity } from '../entities/vehicle.entity.js'
import { CreateVehicleInternalDto } from '../dtos/internal/create-vehicle.internal.dto.js'
import type { VehicleInternalDto } from '../dtos/internal/vehicle.internal.dto.js'
import type { CreateVehicleRequestDto } from '../dtos/external/create-vehicle.dto.js'
import { VehicleRepository, type VehicleFilterOptions } from '../repositories/vehicle.repository.js'

@Injectable()
export class VehicleInternalService {
  constructor(
    private readonly vehicleRepo: VehicleRepository,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateVehicleRequestDto): Promise<Readonly<VehicleInternalDto>> {
    const tenantId = dto.tenantId ?? this.tenant.tenantId

    // Invariante de domínio via entidade pura
    new VehicleEntity({
      id: 'pending',
      tenantId,
      plate: dto.plate,
      model: dto.model,
      ownerId: dto.ownerId,
      contractorId: dto.contractorId,
      custodianId: dto.custodianId,
    })

    const existing = await this.vehicleRepo.findByPlate(tenantId, dto.plate)
    if (existing) {
      throw new ConflictException('Um veículo com esta placa já está registrado.', {
        errorCode: 'FLEET-0002',
      })
    }

    const companiesValid = await this.vehicleRepo.validateCompaniesExist(tenantId, [
      dto.ownerId,
      dto.contractorId,
      dto.custodianId,
    ])

    if (!companiesValid) {
      throw new BadRequestException(
        'Uma ou mais empresas associadas (proprietário, contratante ou custodiante) não foram encontradas no tenant.',
        { errorCode: 'FLEET-0006' },
      )
    }

    const internalDto = new CreateVehicleInternalDto({
      tenantId,
      plate: dto.plate,
      model: dto.model,
      ownerId: dto.ownerId,
      contractorId: dto.contractorId,
      custodianId: dto.custodianId,
    })

    return this.vehicleRepo.create(internalDto)
  }

  async findAll(
    filters?: VehicleFilterOptions,
  ): Promise<ReadonlyArray<Readonly<VehicleInternalDto>>> {
    return this.vehicleRepo.findAll(this.tenant.tenantId, filters)
  }

  async findById(id: string): Promise<Readonly<VehicleInternalDto>> {
    const vehicle = await this.vehicleRepo.findById(this.tenant.tenantId, id)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado', {
        errorCode: 'FLEET-0007',
      })
    }
    return vehicle
  }

  async findByPlate(plate: string): Promise<Readonly<VehicleInternalDto>> {
    const cleanedPlate = plate.toUpperCase().trim()
    const vehicle = await this.vehicleRepo.findByPlate(this.tenant.tenantId, cleanedPlate)
    if (!vehicle) {
      throw new NotFoundException(`Veículo não encontrado para a placa ${cleanedPlate}`, {
        errorCode: 'FLEET-0008',
      })
    }
    return vehicle
  }
}

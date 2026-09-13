import { describe, expect, it, vi, beforeEach } from 'vitest'
import { VehicleExternalService } from './vehicle.external.service.js'
import { VehicleInternalDto } from '../dtos/internal/vehicle.internal.dto.js'
import type { VehicleInternalService } from './vehicle.internal.service.js'

describe('VehicleExternalService', () => {
  let service: VehicleExternalService
  let mockInternal: any
  let mockRedis: any

  const sampleVehicle = new VehicleInternalDto({
    id: 'veh-001',
    tenantId: '00000000-0000-4000-8000-000000000001',
    plate: 'ROM1001',
    model: 'Van Cargo',
    ownerId: 'owner-1',
    contractorId: 'contractor-1',
    custodianId: 'custodian-1',
    createdAt: new Date().toISOString(),
  })

  beforeEach(() => {
    mockInternal = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPlate: vi.fn(),
    }

    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    service = new VehicleExternalService(mockInternal as VehicleInternalService, mockRedis)
  })

  it('deve registrar o veículo no serviço interno e publicar evento no Redis', async () => {
    mockInternal.create.mockResolvedValue(sampleVehicle)

    const input = {
      plate: 'ROM1001',
      model: 'Van Cargo',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
    }

    const result = await service.registerAndBroadcast(input)

    expect(result).toEqual(sampleVehicle)
    expect(mockInternal.create).toHaveBeenCalledWith(input)
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'vehicle_events_stream',
      expect.stringContaining('VEHICLE_REGISTERED'),
    )
  })

  it('deve tolerar falha na publicação do Redis e ainda retornar o veículo criado', async () => {
    mockInternal.create.mockResolvedValue(sampleVehicle)
    mockRedis.publish.mockRejectedValue(new Error('Redis connection lost'))

    const result = await service.registerAndBroadcast({
      plate: 'ROM1001',
      model: 'Van Cargo',
      ownerId: 'owner-1',
      contractorId: 'contractor-1',
      custodianId: 'custodian-1',
    })

    expect(result).toEqual(sampleVehicle)
  })

  it('deve buscar veículo para telemetria por ID primeiro', async () => {
    mockInternal.findById.mockResolvedValue(sampleVehicle)

    const result = await service.getVehicleForTelemetry('tenant-1', 'veh-001')

    expect(result).toEqual(sampleVehicle)
    expect(mockInternal.findById).toHaveBeenCalledWith('veh-001')
  })

  it('deve tentar buscar por placa se a busca por ID falhar', async () => {
    mockInternal.findById.mockRejectedValue(new Error('Not found'))
    mockInternal.findByPlate.mockResolvedValue(sampleVehicle)

    const result = await service.getVehicleForTelemetry('tenant-1', 'ROM1001')

    expect(result).toEqual(sampleVehicle)
    expect(mockInternal.findByPlate).toHaveBeenCalledWith('ROM1001')
  })

  it('deve retornar null se veículo não for localizado nem por ID nem por placa', async () => {
    mockInternal.findById.mockRejectedValue(new Error('Not found'))
    mockInternal.findByPlate.mockRejectedValue(new Error('Not found'))

    const result = await service.getVehicleForTelemetry('tenant-1', 'UNKNOWN')

    expect(result).toBeNull()
  })
})

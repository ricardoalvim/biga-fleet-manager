import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  createVehicleSchema,
  type CreateVehicleRequestDto,
} from '../dtos/external/create-vehicle.dto.js'
import { VehicleExternalService } from '../services/vehicle.external.service.js'
import { VehicleInternalService } from '../services/vehicle.internal.service.js'

@ApiTags('Vehicles')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID ou Slug do Tenant para isolamento dos dados',
})
@Controller(['vehicles', 'api/v1/vehicles'])
export class VehicleController {
  constructor(
    private readonly vehicleInternal: VehicleInternalService,
    private readonly vehicleExternal: VehicleExternalService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra um veículo na frota do tenant e notifica subsistemas externos',
  })
  @ApiResponse({ status: 201, description: 'Veículo registrado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou empresas parceiras inexistentes no tenant.',
  })
  @ApiResponse({ status: 409, description: 'Placa já registrada no tenant.' })
  create(@Body({ schema: createVehicleSchema }) body: CreateVehicleRequestDto) {
    return this.vehicleExternal.registerAndBroadcast(body)
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista veículos do tenant com filtros opcionais de proprietário/contratante/custodiante',
  })
  @ApiQuery({ name: 'ownerId', required: false, description: 'UUID da empresa proprietária' })
  @ApiQuery({ name: 'contractorId', required: false, description: 'UUID da empresa contratante' })
  @ApiQuery({ name: 'custodianId', required: false, description: 'UUID da empresa custodiante' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso.' })
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('contractorId') contractorId?: string,
    @Query('custodianId') custodianId?: string,
  ) {
    return this.vehicleInternal.findAll({ ownerId, contractorId, custodianId })
  }

  @Get('by-plate/:plate')
  @ApiOperation({ summary: 'Busca um veículo pela placa no escopo do tenant' })
  @ApiParam({ name: 'plate', description: 'Placa do veículo' })
  @ApiResponse({ status: 200, description: 'Dados do veículo retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado.' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehicleInternal.findByPlate(plate)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um veículo por ID com suas relações empresariais' })
  @ApiParam({ name: 'id', description: 'UUID do veículo' })
  @ApiResponse({ status: 200, description: 'Dados do veículo retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado.' })
  findById(@Param('id') id: string) {
    return this.vehicleInternal.findById(id)
  }
}

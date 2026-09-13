import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  createTollEventSchema,
  type CreateTollEventDto,
} from '../dtos/external/create-toll-event.dto.js'
import {
  createIncidentSchema,
  type CreateIncidentDto,
} from '../dtos/external/create-incident.dto.js'
import {
  settleIncidentSchema,
  type SettleIncidentDto,
} from '../dtos/external/settle-incident.dto.js'
import { IncidentTollInternalService } from '../services/incident-toll.internal.service.js'

@ApiTags('Incidents & Tolls')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento de pedágios e sinistros',
})
@Controller('api/v1')
export class IncidentTollController {
  constructor(private readonly internalService: IncidentTollInternalService) {}

  @Post('tolls/events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra a passagem em praça de pedágio (Webhook ou Integração externa)',
  })
  @ApiResponse({ status: 201, description: 'Passagem registrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado no tenant (FLEET-0007)' })
  @ApiResponse({
    status: 409,
    description: 'Transação de pedágio duplicada para este tenant (FLEET-0012)',
  })
  registerTollEvent(@Body({ schema: createTollEventSchema }) body: CreateTollEventDto) {
    return this.internalService.registerTollEvent(body)
  }

  @Get('tolls')
  @ApiOperation({ summary: 'Lista eventos de passagens em pedágios com filtros opcionais' })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Filtrar por UUID do veículo' })
  @ApiResponse({ status: 200, description: 'Lista de passagens em pedágios' })
  findTolls(@Query('vehicleId') vehicleId?: string) {
    return this.internalService.findTolls({ vehicleId })
  }

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abre registro de sinistro, avaria ou infração' })
  @ApiResponse({ status: 201, description: 'Sinistro registrado com sucesso' })
  @ApiResponse({
    status: 404,
    description: 'Veículo ou empresa responsável não encontrada no tenant',
  })
  registerIncident(@Body({ schema: createIncidentSchema }) body: CreateIncidentDto) {
    return this.internalService.registerIncident(body)
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Lista ocorrências e sinistros com filtros opcionais' })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Filtrar por veículo' })
  @ApiQuery({
    name: 'responsibleCompanyId',
    required: false,
    description: 'Filtrar por empresa responsável',
  })
  @ApiQuery({
    name: 'incidentType',
    required: false,
    description: 'Filtrar por tipo de ocorrência',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiResponse({ status: 200, description: 'Lista de ocorrências' })
  findIncidents(
    @Query('vehicleId') vehicleId?: string,
    @Query('responsibleCompanyId') responsibleCompanyId?: string,
    @Query('incidentType') incidentType?: string,
    @Query('status') status?: string,
  ) {
    return this.internalService.findIncidents({
      vehicleId,
      responsibleCompanyId,
      incidentType,
      status,
    })
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Consulta os detalhes de uma ocorrência por ID' })
  @ApiParam({ name: 'id', description: 'Identificador único do sinistro' })
  @ApiResponse({ status: 200, description: 'Detalhes da ocorrência' })
  @ApiResponse({ status: 404, description: 'Ocorrência não encontrada (FLEET-0013)' })
  findIncidentById(@Param('id') id: string) {
    return this.internalService.findIncidentById(id)
  }

  @Patch('incidents/:id/settle')
  @ApiOperation({ summary: 'Liquida a ocorrência registrando o custo real final' })
  @ApiParam({ name: 'id', description: 'Identificador único do sinistro' })
  @ApiResponse({ status: 200, description: 'Sinistro liquidado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ocorrência não encontrada (FLEET-0013)' })
  @ApiResponse({ status: 409, description: 'Ocorrência já liquidada anteriormente (FLEET-0014)' })
  settleIncident(
    @Param('id') id: string,
    @Body({ schema: settleIncidentSchema }) body: SettleIncidentDto,
  ) {
    return this.internalService.settleIncident(id, body)
  }

  @Get('vehicles/:vehicleId/financial-summary')
  @ApiOperation({
    summary: 'Resumo financeiro acumulado de pedágios e sinistros para alimentação do TCO',
  })
  @ApiParam({ name: 'vehicleId', description: 'UUID do veículo' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro consolidado do veículo' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado (FLEET-0007)' })
  getVehicleFinancialSummary(@Param('vehicleId') vehicleId: string) {
    return this.internalService.getVehicleFinancialSummary(vehicleId)
  }
}

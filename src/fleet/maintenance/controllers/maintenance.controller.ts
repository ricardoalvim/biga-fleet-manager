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
  createMaintenancePlanSchema,
  type CreateMaintenancePlanDto,
} from '../dtos/external/create-maintenance-plan.dto.js'
import {
  createMaintenanceOrderSchema,
  type CreateMaintenanceOrderDto,
} from '../dtos/external/create-maintenance-order.dto.js'
import {
  completeMaintenanceOrderSchema,
  type CompleteMaintenanceOrderDto,
} from '../dtos/external/complete-maintenance-order.dto.js'
import { MaintenanceInternalService } from '../services/maintenance.internal.service.js'

@ApiTags('Maintenance')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento dos dados de manutenção',
})
@Controller('maintenances')
export class MaintenanceController {
  constructor(private readonly internalService: MaintenanceInternalService) {}

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um plano de revisão preventiva por rodagem' })
  @ApiResponse({ status: 201, description: 'Plano de manutenção criado com sucesso' })
  createPlan(@Body({ schema: createMaintenancePlanSchema }) body: CreateMaintenancePlanDto) {
    return this.internalService.createPlan(body)
  }

  @Get('plans')
  @ApiOperation({ summary: 'Lista os planos de manutenção configurados no tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos de revisão ordenada por quilometragem',
  })
  findPlans() {
    return this.internalService.findPlans()
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abre uma Ordem de Serviço (O.S.) detalhada' })
  @ApiResponse({ status: 201, description: 'Ordem de serviço aberta com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Empresa prestadora não é do tipo MAINTENANCE (FLEET-0009)',
  })
  @ApiResponse({ status: 404, description: 'Veículo ou prestador não encontrado no tenant' })
  createOrder(@Body({ schema: createMaintenanceOrderSchema }) body: CreateMaintenanceOrderDto) {
    return this.internalService.createOrder(body)
  }

  @Patch('orders/:id/complete')
  @ApiOperation({
    summary: 'Aponta a execução item a item, custos de indisponibilidade e conclui a O.S.',
  })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço a ser concluída' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço concluída com custos agregados calculados',
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não localizada (FLEET-0010)' })
  @ApiResponse({ status: 409, description: 'Ordem já concluída anteriormente (FLEET-0011)' })
  completeOrder(
    @Param('id') id: string,
    @Body({ schema: completeMaintenanceOrderSchema }) body: CompleteMaintenanceOrderDto,
  ) {
    return this.internalService.completeOrder(id, body)
  }

  @Get('orders')
  @ApiOperation({ summary: 'Lista ordens de serviço do tenant com filtros opcionais' })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Filtrar por veículo' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filtrar por prestador/oficina' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status da ordem' })
  @ApiResponse({ status: 200, description: 'Lista de ordens de serviço' })
  findOrders(
    @Query('vehicleId') vehicleId?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: string,
  ) {
    return this.internalService.findOrders({ vehicleId, providerId, status })
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Consulta os detalhes e itens de uma ordem de serviço por ID' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Detalhes completos da ordem de serviço' })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não localizada (FLEET-0010)' })
  findOrderById(@Param('id') id: string) {
    return this.internalService.findOrderById(id)
  }

  @Get('vehicles/:vehicleId/suggestions')
  @ApiOperation({
    summary: 'Gera sugestões preditivas de revisão com base na quilometragem acumulada',
  })
  @ApiParam({ name: 'vehicleId', description: 'UUID do veículo' })
  @ApiQuery({
    name: 'currentKm',
    required: false,
    type: Number,
    description: 'Quilometragem opcional para simulação de intervenções',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico preditivo com status (DUE, OVERDUE, UPCOMING)',
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado no tenant (FLEET-0007)' })
  getPredictiveSuggestions(
    @Param('vehicleId') vehicleId: string,
    @Query('currentKm') currentKm?: string,
  ) {
    const kmOverride = currentKm ? Number(currentKm) : undefined
    return this.internalService.getPredictiveSuggestions(vehicleId, kmOverride)
  }
}

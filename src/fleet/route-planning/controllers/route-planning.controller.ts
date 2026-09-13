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
  createRouteProfileSchema,
  type CreateRouteProfileDto,
} from '../dtos/external/create-route-profile.dto.js'
import {
  calculateRouteSchema,
  type CalculateRouteDto,
} from '../dtos/external/calculate-route.dto.js'
import { RoutePlanningInternalService } from '../services/route-planning.internal.service.js'

@ApiTags('Route Planning')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento operacional de rotas e perfis',
})
@Controller('api/v1')
export class RoutePlanningController {
  constructor(private readonly internalService: RoutePlanningInternalService) {}

  @Post('route-profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria perfil de rota contextualizado (DELIVERY, PASSENGER, HEAVY_CARGO, AGRICULTURAL)',
  })
  @ApiResponse({ status: 201, description: 'Perfil contextual criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros de restrição inválidos' })
  createProfile(@Body({ schema: createRouteProfileSchema }) body: CreateRouteProfileDto) {
    return this.internalService.createProfile(body)
  }

  @Get('route-profiles')
  @ApiOperation({ summary: 'Lista perfis de rota com filtro opcional por contexto de negócio' })
  @ApiQuery({
    name: 'businessContext',
    required: false,
    enum: ['DELIVERY', 'PASSENGER', 'HEAVY_CARGO', 'AGRICULTURAL'],
    description: 'Filtrar por contexto operacional',
  })
  @ApiResponse({ status: 200, description: 'Lista de perfis de rota cadastrados' })
  findProfiles(@Query('businessContext') businessContext?: string) {
    return this.internalService.listProfiles(undefined, { businessContext })
  }

  @Get('route-profiles/:id')
  @ApiOperation({ summary: 'Consulta os detalhes de um perfil de rota por ID' })
  @ApiParam({ name: 'id', description: 'Identificador único do perfil de rota' })
  @ApiResponse({ status: 200, description: 'Detalhes do perfil de rota' })
  @ApiResponse({ status: 404, description: 'Perfil de rota não encontrado (FLEET-0015)' })
  findProfileById(@Param('id') id: string) {
    return this.internalService.getProfileById(id)
  }

  @Post('routes/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Calcula rota otimizada, distância geodésica, tempo estimado e consumo de combustível projetado por contexto',
  })
  @ApiResponse({ status: 200, description: 'Rota calculada e traçada com sucesso' })
  @ApiResponse({ status: 400, description: 'Coordenadas ou waypoints inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Veículo (FLEET-0007) ou Perfil (FLEET-0015) não encontrado no tenant',
  })
  calculateRoute(@Body({ schema: calculateRouteSchema }) body: CalculateRouteDto) {
    return this.internalService.calculateRoute(body)
  }

  @Get('routes')
  @ApiOperation({ summary: 'Lista rotas planejadas com filtros opcionais' })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Filtrar por UUID do veículo' })
  @ApiQuery({
    name: 'profileId',
    required: false,
    description: 'Filtrar por UUID do perfil de rota',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    description: 'Filtrar por status da rota',
  })
  @ApiResponse({ status: 200, description: 'Lista de rotas planejadas' })
  findRoutes(
    @Query('vehicleId') vehicleId?: string,
    @Query('profileId') profileId?: string,
    @Query('status') status?: string,
  ) {
    return this.internalService.listRoutes(undefined, {
      vehicleId,
      profileId,
      status,
    })
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Consulta os detalhes de uma rota planejada por ID' })
  @ApiParam({ name: 'id', description: 'Identificador único da rota' })
  @ApiResponse({ status: 200, description: 'Detalhes da rota planejada' })
  @ApiResponse({ status: 404, description: 'Rota não encontrada no tenant (FLEET-0016)' })
  findRouteById(@Param('id') id: string) {
    return this.internalService.getRouteById(id)
  }

  @Patch('routes/:id/dispatch')
  @ApiOperation({
    summary: 'Despacha a rota planejada para o terminal do motorista ou dispositivo IoT embarcado',
  })
  @ApiParam({ name: 'id', description: 'Identificador único da rota' })
  @ApiResponse({ status: 200, description: 'Rota despachada com sucesso' })
  @ApiResponse({ status: 404, description: 'Rota não encontrada (FLEET-0016)' })
  @ApiResponse({ status: 409, description: 'Rota já foi despachada ou finalizada (FLEET-0017)' })
  dispatchRoute(@Param('id') id: string) {
    return this.internalService.dispatchRoute(id)
  }
}

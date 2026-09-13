import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { startTripSchema, type StartTripDto } from '../dtos/external/start-trip.dto.js'
import { tripIdParamSchema } from '../dtos/external/trip-id-param.dto.js'
import { TripInternalService } from '../services/trip.internal.service.js'

@ApiTags('Trips')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant que contextualiza o isolamento de dados',
})
@Controller('trips')
export class TripController {
  constructor(private readonly internalService: TripInternalService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inicia uma nova viagem ou retorna viagem ativa existente' })
  @ApiResponse({ status: 201, description: 'Viagem iniciada com sucesso ou retornada' })
  @ApiResponse({
    status: 404,
    description: 'Veículo não encontrado para o tenant informado (FLEET-0007)',
  })
  start(@Body({ schema: startTripSchema }) body: StartTripDto) {
    return this.internalService.startTrip(body.vehicleId, body.tenantId)
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Encerra uma viagem ativa calculando o odômetro' })
  @ApiParam({ name: 'id', description: 'UUID da viagem ativa a ser finalizada' })
  @ApiResponse({ status: 200, description: 'Viagem finalizada com sucesso e odômetro calculado' })
  @ApiResponse({ status: 404, description: 'Viagem não encontrada no tenant (FLEET-0003)' })
  @ApiResponse({ status: 409, description: 'Viagem já foi encerrada anteriormente (FLEET-0004)' })
  finish(@Param('id', { schema: tripIdParamSchema }) id: string) {
    return this.internalService.finishTrip(id)
  }

  @Get('active')
  @ApiOperation({ summary: 'Lista viagens em andamento no tenant' })
  @ApiResponse({ status: 200, description: 'Lista de viagens ativas ordenadas cronologicamente' })
  findActive() {
    return this.internalService.findActiveTrips()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma viagem por ID' })
  @ApiParam({ name: 'id', description: 'UUID da viagem' })
  @ApiResponse({ status: 200, description: 'Detalhes da viagem e veículo associado' })
  @ApiResponse({ status: 404, description: 'Viagem não encontrada no tenant (FLEET-0003)' })
  findById(@Param('id', { schema: tripIdParamSchema }) id: string) {
    return this.internalService.findById(id)
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Relatório operacional, rota geocodificada e métricas de desempenho' })
  @ApiParam({ name: 'id', description: 'UUID da viagem' })
  @ApiResponse({ status: 200, description: 'Relatório completo com pontos de rota e estatísticas' })
  @ApiResponse({ status: 404, description: 'Viagem não encontrada no tenant (FLEET-0003)' })
  getReport(@Param('id', { schema: tripIdParamSchema }) id: string) {
    return this.internalService.getTripReport(id)
  }
}

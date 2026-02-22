import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { FleetService } from './fleet.service'
import { CreateChariotDto } from './dto/create-chariot.dto'
import { FleetOverviewService } from './fleet-overview.service'

@ApiTags('Fleet (Chariots)')
@Controller('fleet')
export class FleetController {
  constructor(
    private readonly fleetService: FleetService,
    private readonly fleetOverviewService: FleetOverviewService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra uma nova Biga na frota' })
  @ApiResponse({ status: 201, description: 'Biga registrada com sucesso.' })
  @ApiResponse({ status: 409, description: 'Conflito: Placa já existente.' })
  @ApiBody({ type: CreateChariotDto })
  async create(@Body() dto: CreateChariotDto) {
    return this.fleetService.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as Bigas do Império' })
  @ApiResponse({ status: 200, description: 'Frota listada com sucesso.' })
  async findAll() {
    return this.fleetService.findAll()
  }

  @Get('overview')
  @ApiOperation({ summary: 'Métricas consolidadas para o Dashboard do Imperador' })
  async getOverview() {
    return this.fleetOverviewService.getDashboardStats()
  }
}

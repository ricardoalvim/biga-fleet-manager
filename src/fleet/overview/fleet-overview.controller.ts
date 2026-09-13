import { Controller, Get } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FleetOverviewService } from './fleet-overview.service.js'

@ApiTags('Fleet')
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('fleet')
export class FleetOverviewController {
  constructor(private readonly overview: FleetOverviewService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Métricas consolidadas do dashboard' })
  getOverview() {
    return this.overview.getDashboardStats()
  }
}

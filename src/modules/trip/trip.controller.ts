import { Controller, Post, Body, Get, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger'
import { TripService } from './trip.service'
import { CreateTripDto } from './dto/create-trip.dto'

@ApiTags('Trips (Corridas)')
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dá a largada em uma nova corrida' })
  @ApiResponse({ status: 201, description: 'Corrida iniciada.' })
  @ApiBody({ type: CreateTripDto })
  async start(@Body() dto: CreateTripDto) {
    return this.tripService.startTrip(dto.chariotId)
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Encerra uma corrida ativa' })
  @ApiParam({ name: 'id', description: 'ID da corrida (Trip)' })
  @ApiResponse({ status: 200, description: 'Corrida finalizada com sucesso.' })
  async finish(@Param('id') id: string) {
    return this.tripService.finishTrip(id)
  }

  @Get('active')
  @ApiOperation({ summary: 'Lista todas as bigas correndo nas ruas neste momento' })
  async findActive() {
    return this.tripService.findActiveTrips()
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { createTenantSchema, type CreateTenantInput } from './schemas/create-tenant.schema.js'
import { TenantService } from './tenant.service.js'

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um tenant (locadora / organização)' })
  create(@Body({ schema: createTenantSchema }) body: CreateTenantInput) {
    return this.tenants.create(body)
  }

  @Get()
  @ApiOperation({ summary: 'Lista tenants' })
  findAll() {
    return this.tenants.findAll()
  }
}

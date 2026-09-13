import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { createCompanySchema, type CreateCompanyInput } from './schemas/create-company.schema.js'
import { CompanyService } from './company.service.js'

@ApiTags('Companies')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'ID ou Slug do Tenant para isolamento dos dados',
})
@Controller('companies')
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra uma nova empresa no tenant' })
  @ApiResponse({ status: 201, description: 'Empresa cadastrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'Empresa com este documento já cadastrada no tenant.' })
  create(@Body({ schema: createCompanySchema }) body: CreateCompanyInput) {
    return this.companies.create(body)
  }

  @Get()
  @ApiOperation({ summary: 'Lista empresas do tenant' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['CLIENT', 'RENTAL', 'MAINTENANCE'],
    description: 'Filtro por papel da empresa',
  })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso.' })
  findAll(@Query('type') type?: 'CLIENT' | 'RENTAL' | 'MAINTENANCE') {
    return this.companies.findAll(type)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por ID com suas frotas vinculadas' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  @ApiResponse({ status: 200, description: 'Dados da empresa retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada no tenant.' })
  findById(@Param('id') id: string) {
    return this.companies.findById(id)
  }
}

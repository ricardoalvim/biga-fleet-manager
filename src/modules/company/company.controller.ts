import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { CompanyService } from './company.service'
import { CreateCompanyDto } from './dto/create-company.dto'

@ApiTags('Companies') // Cria a pastinha "Companies" no Swagger
@Controller('companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registra uma nova empresa no Império' })
    @ApiResponse({ status: 201, description: 'Empresa cadastrada com sucesso.' })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou CNPJ já existente.' })
    @ApiBody({ type: CreateCompanyDto })
    async create(@Body() dto: CreateCompanyDto) {
        return this.companyService.create(dto)
    }

    @Get()
    @ApiOperation({ summary: 'Lista todas as empresas cadastradas' })
    @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso.' })
    async findAll() {
        return this.companyService.findAll()
    }
}
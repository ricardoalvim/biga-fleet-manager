import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  registerWebhookSchema,
  type RegisterWebhookDto,
} from '../dtos/external/register-webhook.dto.js'
import {
  updateTenantConfigSchema,
  type UpdateTenantConfigDto,
} from '../dtos/external/update-tenant-config.dto.js'
import { PlatformEcosystemInternalService } from '../services/platform-ecosystem.internal.service.js'

@ApiTags('Platform & Ecosystem')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento de webhooks e customizações White-Label',
})
@Controller('api/v1/platform')
export class PlatformEcosystemController {
  constructor(private readonly internalService: PlatformEcosystemInternalService) {}

  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registra novo webhook para recebimento assíncrono de eventos de ciclo de vida da frota',
  })
  @ApiResponse({ status: 201, description: 'Webhook registrado com sucesso no barramento' })
  @ApiResponse({ status: 400, description: 'Parâmetros de webhook inválidos ou URL mal formatada' })
  registerWebhook(@Body({ schema: registerWebhookSchema }) body: RegisterWebhookDto) {
    return this.internalService.registerWebhook(body)
  }

  @Get('webhooks')
  @ApiOperation({
    summary: 'Lista os webhooks cadastrados para o tenant com filtro opcional por status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Filtrar por status do webhook',
  })
  @ApiResponse({ status: 200, description: 'Lista de webhooks configurados' })
  listWebhooks(@Query('status') status?: string) {
    return this.internalService.listWebhooks(undefined, { status })
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Consulta os detalhes de um webhook cadastrado por ID' })
  @ApiParam({ name: 'id', description: 'UUID do webhook' })
  @ApiResponse({ status: 200, description: 'Detalhes do webhook' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado (PLATFORM-0001)' })
  getWebhookById(@Param('id') id: string) {
    return this.internalService.getWebhookById(id)
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Revoga e remove o webhook cadastrado para o tenant' })
  @ApiParam({ name: 'id', description: 'UUID do webhook' })
  @ApiResponse({ status: 200, description: 'Webhook revogado com sucesso' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado (PLATFORM-0001)' })
  deleteWebhook(@Param('id') id: string) {
    return this.internalService.deleteWebhook(id)
  }

  @Post('webhooks/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dispara um evento de teste assinado criptograficamente (HMAC-SHA256) para validação do endpoint receptor',
  })
  @ApiParam({ name: 'id', description: 'UUID do webhook' })
  @ApiResponse({ status: 200, description: 'Resultado da entrega do teste' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado (PLATFORM-0001)' })
  testWebhook(@Param('id') id: string) {
    return this.internalService.testWebhook(id)
  }

  @Get('tenants/config')
  @ApiOperation({
    summary:
      'Consulta as configurações de customização visual (White-Label), módulos ativos e vocabulário',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações visuais e operacionais de autoatendimento do tenant',
  })
  getTenantConfig() {
    return this.internalService.getTenantConfig()
  }

  @Put('tenants/config')
  @ApiOperation({
    summary:
      'Atualiza as preferências visuais (White-Label), cores, logotipo e módulos contratados do tenant',
  })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas com sucesso' })
  @ApiResponse({ status: 400, description: 'Cores ou parâmetros de branding inválidos' })
  updateTenantConfig(@Body({ schema: updateTenantConfigSchema }) body: UpdateTenantConfigDto) {
    return this.internalService.updateTenantConfig(body)
  }
}

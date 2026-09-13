import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { createRoleSchema, type CreateRoleDto } from '../dtos/external/create-role.dto.js'
import {
  updateOnboardingStepSchema,
  type UpdateOnboardingStepDto,
} from '../dtos/external/update-onboarding-step.dto.js'
import {
  createSupportTicketSchema,
  replySupportTicketSchema,
  type CreateSupportTicketDto,
  type ReplySupportTicketDto,
} from '../dtos/external/create-support-ticket.dto.js'
import {
  updateTenantLicensesSchema,
  type UpdateTenantLicensesDto,
} from '../dtos/external/update-tenant-licenses.dto.js'
import { PortalInternalService } from '../services/portal.internal.service.js'

@ApiTags('Portal & Enterprise Dashboard')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento multi-inquilino de RBAC, onboarding e suporte',
})
@Controller('api/v1/portal')
export class PortalController {
  constructor(private readonly internalService: PortalInternalService) {}

  // ----------------- RBAC & DYNAMIC MENU TREE -----------------

  @Get('menus/me')
  @ApiOperation({
    summary:
      'Retorna a árvore de menus dinâmicos e branding White-Label filtrada pelas permissões do usuário e módulos contratados',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    description:
      'ID do perfil de acesso para filtragem RBAC (opcional, assume admin do tenant por padrão)',
  })
  @ApiResponse({
    status: 200,
    description: 'Árvore de navegação e metadados de branding autorizados',
  })
  getUserMenuTree(@Query('roleId') roleId?: string) {
    return this.internalService.getUserMenuTree(roleId)
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastra um novo perfil de acesso customizado com lista de permissões granulares',
  })
  @ApiResponse({ status: 201, description: 'Perfil de acesso criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de permissão ou nomenclatura inválidos' })
  createRole(@Body({ schema: createRoleSchema }) body: CreateRoleDto) {
    return this.internalService.createRole(body)
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lista os perfis de acesso (RBAC) cadastrados para o tenant' })
  @ApiResponse({ status: 200, description: 'Lista de perfis de acesso' })
  listRoles() {
    return this.internalService.listRoles()
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Consulta os detalhes e permissões de um perfil de acesso por ID' })
  @ApiParam({ name: 'id', description: 'UUID do perfil de acesso' })
  @ApiResponse({ status: 200, description: 'Detalhes do perfil de acesso' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado (PORTAL-0002)' })
  getRoleById(@Param('id') id: string) {
    return this.internalService.getRoleById(id)
  }

  // ----------------- ONBOARDING JOURNEY -----------------

  @Get('onboarding')
  @ApiOperation({
    summary:
      'Retorna a jornada de onboarding guiada em 5 etapas para novos frotistas com status de completude',
  })
  @ApiResponse({ status: 200, description: 'Estado atual do onboarding e progresso percentual' })
  getOnboardingJourney() {
    return this.internalService.getOnboardingJourney()
  }

  @Patch('onboarding/steps/:stepIndex')
  @ApiOperation({
    summary:
      'Atualiza o status de conclusão e metadados de uma etapa específica do onboarding (1 a 5)',
  })
  @ApiParam({ name: 'stepIndex', description: 'Número ordinal da etapa (1 a 5)', example: 1 })
  @ApiResponse({ status: 200, description: 'Etapa de onboarding atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Índice de etapa inválido ou transição ilegal' })
  updateOnboardingStep(
    @Param('stepIndex', ParseIntPipe) stepIndex: number,
    @Body({ schema: updateOnboardingStepSchema }) body: UpdateOnboardingStepDto,
  ) {
    return this.internalService.updateOnboardingStep(stepIndex, body)
  }

  // ----------------- SUPPORT TICKETS / HELP DESK -----------------

  @Post('support/tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abre um novo chamado de suporte técnico ou atendimento operacional',
  })
  @ApiResponse({ status: 201, description: 'Chamado aberto com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados do chamado ou categoria inválidos' })
  createSupportTicket(@Body({ schema: createSupportTicketSchema }) body: CreateSupportTicketDto) {
    return this.internalService.createSupportTicket(body)
  }

  @Get('support/tickets')
  @ApiOperation({
    summary: 'Lista chamados de suporte do tenant com filtros por status e categoria',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'],
    description: 'Filtrar por status do ticket',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['BILLING', 'TECHNICAL', 'DEVICE_INTEGRATION', 'ONBOARDING', 'GENERAL'],
    description: 'Filtrar por categoria do chamado',
  })
  @ApiResponse({ status: 200, description: 'Lista de chamados de suporte' })
  listSupportTickets(@Query('status') status?: string, @Query('category') category?: string) {
    return this.internalService.listSupportTickets(undefined, status, category)
  }

  @Get('support/tickets/:id')
  @ApiOperation({ summary: 'Consulta o histórico completo de interações de um chamado de suporte' })
  @ApiParam({ name: 'id', description: 'UUID do chamado de suporte' })
  @ApiResponse({ status: 200, description: 'Detalhes e timeline do chamado' })
  @ApiResponse({ status: 404, description: 'Chamado não encontrado (PORTAL-0003)' })
  getSupportTicketById(@Param('id') id: string) {
    return this.internalService.getSupportTicketById(id)
  }

  @Patch('support/tickets/:id/reply')
  @ApiOperation({
    summary: 'Adiciona uma mensagem de resposta ou altera o status de um chamado de suporte',
  })
  @ApiParam({ name: 'id', description: 'UUID do chamado de suporte' })
  @ApiResponse({ status: 200, description: 'Chamado respondido e atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Chamado não encontrado (PORTAL-0003)' })
  replySupportTicket(
    @Param('id') id: string,
    @Body({ schema: replySupportTicketSchema }) body: ReplySupportTicketDto,
  ) {
    return this.internalService.replySupportTicket(id, body)
  }

  // ----------------- BIGA ADMIN & TENANT LICENSING -----------------

  @Get('admin/tenants')
  @ApiOperation({
    summary:
      'Painel Global Biga Admin: Lista todos os tenants da plataforma com seus módulos e customizações',
  })
  @ApiResponse({
    status: 200,
    description: 'Visão consolidada de todos os tenants e licenças ativas',
  })
  listTenantsForAdmin() {
    return this.internalService.listTenantsForAdmin()
  }

  @Patch('admin/tenants/:tenantId/licenses')
  @ApiOperation({
    summary:
      'Painel Global Biga Admin: Atualiza os módulos de software licenciados para um tenant específico',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant gerenciado' })
  @ApiResponse({ status: 200, description: 'Licenciamento do tenant atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Lista de módulos inválida' })
  updateTenantLicenses(
    @Param('tenantId') tenantId: string,
    @Body({ schema: updateTenantLicensesSchema }) body: UpdateTenantLicensesDto,
  ) {
    return this.internalService.updateTenantLicenses(tenantId, body)
  }

  // ----------------- DYNAMIC MARKETPLACE -----------------

  @Get('marketplace/catalog')
  @ApiOperation({
    summary:
      'Retorna o catálogo dinâmico de integrações de mercado (SAP, TOTVS, Sem Parar, HERE) orientado pelo OpenAPI',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de plugins e especificações de integração' })
  getMarketplaceCatalog() {
    return this.internalService.getMarketplaceCatalog()
  }
}

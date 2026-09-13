import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { PlatformEcosystemRepository } from '../../ecosystem/repositories/platform-ecosystem.repository.js'
import { TenantCustomizationInternalDto } from '../../ecosystem/dtos/internal/tenant-customization.internal.dto.js'
import { SaveTenantConfigInternalDto } from '../../ecosystem/dtos/internal/save-tenant-config.internal.dto.js'
import { RolePermissionEntity } from '../entities/role-permission.entity.js'
import { OnboardingJourneyEntity } from '../entities/onboarding-journey.entity.js'
import { SupportTicketEntity } from '../entities/support-ticket.entity.js'
import { RoleInternalDto } from '../dtos/internal/role.internal.dto.js'
import { OnboardingJourneyInternalDto } from '../dtos/internal/onboarding-journey.internal.dto.js'
import { SupportTicketInternalDto } from '../dtos/internal/support-ticket.internal.dto.js'
import {
  PortalMenuTreeInternalDto,
  type MenuItemInternalProps,
} from '../dtos/internal/portal-menu-tree.internal.dto.js'
import type { CreateRoleDto } from '../dtos/external/create-role.dto.js'
import type { UpdateOnboardingStepDto } from '../dtos/external/update-onboarding-step.dto.js'
import type {
  CreateSupportTicketDto,
  ReplySupportTicketDto,
} from '../dtos/external/create-support-ticket.dto.js'
import type { UpdateTenantLicensesDto } from '../dtos/external/update-tenant-licenses.dto.js'
import { PortalRepository } from '../repositories/portal.repository.js'
import { PortalExternalService } from './portal.external.service.js'

export interface MarketplaceIntegrationItem {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: string
  readonly icon: string
  readonly requiredModule: string
  readonly apiDocsUrl: string
  readonly status: 'AVAILABLE' | 'ACTIVE' | 'REQUIRES_MODULE'
}

export interface MarketplaceCatalogDto {
  readonly title: string
  readonly version: string
  readonly openApiSpecUrl: string
  readonly integrations: readonly MarketplaceIntegrationItem[]
}

const ALL_PORTAL_CANDIDATE_MENUS: ReadonlyArray<MenuItemInternalProps> = [
  {
    id: 'menu-fleet',
    label: 'Frota & Ativos',
    path: '/app/fleet',
    icon: 'truck',
    moduleKey: 'VEHICLES',
    requiredPermission: 'fleet:vehicles:read',
  },
  {
    id: 'menu-trips',
    label: 'Viagens & Itinerários',
    path: '/app/trips',
    icon: 'map-pin',
    moduleKey: 'TRIPS',
    requiredPermission: 'fleet:trips:read',
  },
  {
    id: 'menu-maintenance',
    label: 'Oficina & Manutenção',
    path: '/app/maintenance',
    icon: 'wrench',
    moduleKey: 'MAINTENANCE',
    requiredPermission: 'fleet:maintenance:read',
  },
  {
    id: 'menu-incidents',
    label: 'Sinistros & Pedágios',
    path: '/app/incidents',
    icon: 'alert-triangle',
    moduleKey: 'INCIDENTS_TOLLS',
    requiredPermission: 'fleet:incidents_tolls:read',
  },
  {
    id: 'menu-routes',
    label: 'Roteirização Inteligente',
    path: '/app/routes',
    icon: 'navigation',
    moduleKey: 'ROUTE_PLANNING',
    requiredPermission: 'fleet:routes:read',
  },
  {
    id: 'menu-telemetry',
    label: 'Telemetria em Tempo Real',
    path: '/app/telemetry',
    icon: 'activity',
    moduleKey: 'TELEMETRY',
    requiredPermission: 'fleet:telemetry:read',
  },
  {
    id: 'menu-onboarding',
    label: 'Guia de Implantação',
    path: '/app/onboarding',
    icon: 'compass',
    moduleKey: 'PORTAL_CORE',
    requiredPermission: 'portal:onboarding:read',
    badge: 'Setup',
  },
  {
    id: 'menu-marketplace',
    label: 'Loja de Integrações',
    path: '/app/marketplace',
    icon: 'grid',
    moduleKey: 'PORTAL_CORE',
    requiredPermission: 'portal:marketplace:read',
  },
  {
    id: 'menu-support',
    label: 'Central de Chamados',
    path: '/app/support',
    icon: 'help-circle',
    moduleKey: 'PORTAL_CORE',
    requiredPermission: 'portal:support:read',
  },
  {
    id: 'menu-settings',
    label: 'Configurações White-Label',
    path: '/app/settings',
    icon: 'settings',
    moduleKey: 'PORTAL_CORE',
    requiredPermission: 'portal:settings:admin',
  },
]

@Injectable()
export class PortalInternalService {
  constructor(
    private readonly repository: PortalRepository,
    private readonly ecosystemRepo: PlatformEcosystemRepository,
    private readonly externalService: PortalExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  // ----------------- RBAC & DYNAMIC MENUS -----------------

  async getUserMenuTree(
    roleId?: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<PortalMenuTreeInternalDto>> {
    const tenantConfig = await this.ecosystemRepo.findTenantConfig(tenantId)
    const enabledModules = tenantConfig?.enabledModules ?? [
      'VEHICLES',
      'TRIPS',
      'MAINTENANCE',
      'INCIDENTS_TOLLS',
      'ROUTE_PLANNING',
      'TELEMETRY',
    ]

    let rolePermissions: readonly string[] = ['*']
    let roleName = 'Administrador do Tenant'

    if (roleId) {
      const role = await this.repository.findRoleById(tenantId, roleId)
      if (role) {
        rolePermissions = role.permissions
        roleName = role.name
      }
    }

    const roleEntity = new RolePermissionEntity({
      id: roleId ?? 'default-admin-role',
      tenantId,
      name: roleName,
      permissions: [...rolePermissions],
    })

    const filteredItems = ALL_PORTAL_CANDIDATE_MENUS.filter((item) => {
      const isModuleEnabled =
        item.moduleKey === 'PORTAL_CORE' || enabledModules.includes(item.moduleKey)
      const hasPermission = roleEntity.hasPermission(item.requiredPermission)
      return isModuleEnabled && hasPermission
    })

    return new PortalMenuTreeInternalDto({
      tenantId,
      roleId,
      roleName,
      branding: {
        displayName: tenantConfig?.displayName ?? 'Biga Fleet Manager',
        logoUrl: tenantConfig?.logoUrl ?? null,
        primaryColor: tenantConfig?.primaryColor ?? '#1E3A8A',
        secondaryColor: tenantConfig?.secondaryColor ?? '#3B82F6',
      },
      items: filteredItems,
    })
  }

  async createRole(
    dto: CreateRoleDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<RoleInternalDto>> {
    let entity: RolePermissionEntity
    try {
      entity = new RolePermissionEntity({
        id: crypto.randomUUID(),
        tenantId,
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions,
        isSystemDefault: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    return this.repository.createRole({
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      description: entity.description,
      permissions: entity.permissions,
      isSystemDefault: entity.isSystemDefault,
    })
  }

  async listRoles(
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<RoleInternalDto>>> {
    return this.repository.findRoles(tenantId)
  }

  async getRoleById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<RoleInternalDto>> {
    const role = await this.repository.findRoleById(tenantId, id)
    if (!role) {
      throw new NotFoundException('Papel de acesso não encontrado para o tenant informado', {
        errorCode: 'PORTAL-0002',
      })
    }
    return role
  }

  // ----------------- ONBOARDING JOURNEY -----------------

  async getOnboardingJourney(
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<OnboardingJourneyInternalDto>> {
    const existing = await this.repository.findOnboardingJourney(tenantId)
    if (existing) {
      return existing
    }

    // Inicializa a jornada do zero
    const initialEntity = new OnboardingJourneyEntity({
      id: crypto.randomUUID(),
      tenantId,
    })

    return this.repository.saveOnboardingJourney({
      id: initialEntity.id,
      tenantId: initialEntity.tenantId,
      currentStepIndex: initialEntity.currentStepIndex,
      steps: initialEntity.steps,
      isCompleted: initialEntity.isCompleted,
    })
  }

  async updateOnboardingStep(
    stepIndex: number,
    dto: UpdateOnboardingStepDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<OnboardingJourneyInternalDto>> {
    const current = await this.getOnboardingJourney(tenantId)

    const entity = new OnboardingJourneyEntity({
      id: current.id,
      tenantId: current.tenantId,
      currentStepIndex: current.currentStepIndex,
      steps: current.steps.map((s) => ({
        stepIndex: s.stepIndex,
        code: s.code,
        title: s.title,
        status: s.status,
        completedAt: s.completedAt ? new Date(s.completedAt) : null,
        metadata: s.metadata,
      })),
      isCompleted: current.isCompleted,
    })

    const updatedEntity = entity.updateStep(stepIndex, dto.status, dto.metadata)

    const saved = await this.repository.saveOnboardingJourney({
      id: updatedEntity.id,
      tenantId: updatedEntity.tenantId,
      currentStepIndex: updatedEntity.currentStepIndex,
      steps: updatedEntity.steps,
      isCompleted: updatedEntity.isCompleted,
    })

    await this.externalService.notifyOnboardingStepUpdated(tenantId, stepIndex, dto.status)

    return saved
  }

  // ----------------- SUPPORT TICKETS -----------------

  async createSupportTicket(
    dto: CreateSupportTicketDto,
    openedByUserId = 'usr-default',
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<SupportTicketInternalDto>> {
    let entity: SupportTicketEntity
    try {
      entity = new SupportTicketEntity({
        id: crypto.randomUUID(),
        tenantId,
        openedByUserId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        status: 'OPEN',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    const created = await this.repository.createTicket({
      id: entity.id,
      tenantId: entity.tenantId,
      openedByUserId: entity.openedByUserId,
      title: entity.title,
      description: entity.description,
      category: entity.category,
      priority: entity.priority,
      status: entity.status,
      messages: entity.messages,
    })

    await this.externalService.notifyTicketOpened(created)

    return created
  }

  async listSupportTickets(
    tenantId: string | null = this.tenantContext.tenantId,
    status?: string,
    category?: string,
  ): Promise<ReadonlyArray<Readonly<SupportTicketInternalDto>>> {
    return this.repository.findTickets({
      tenantId: tenantId ?? undefined,
      status,
      category,
    })
  }

  async getSupportTicketById(
    id: string,
    tenantId: string | null = this.tenantContext.tenantId,
  ): Promise<Readonly<SupportTicketInternalDto>> {
    const ticket = await this.repository.findTicketById(tenantId, id)
    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado', {
        errorCode: 'PORTAL-0003',
      })
    }
    return ticket
  }

  async replySupportTicket(
    id: string,
    dto: ReplySupportTicketDto,
    authorId = 'usr-agent',
    authorName = 'Equipe de Suporte Biga',
    isStaff = false,
    tenantId: string | null = this.tenantContext.tenantId,
  ): Promise<Readonly<SupportTicketInternalDto>> {
    const ticket = await this.getSupportTicketById(id, tenantId)

    const entity = new SupportTicketEntity({
      id: ticket.id,
      tenantId: ticket.tenantId,
      openedByUserId: ticket.openedByUserId,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      messages: ticket.messages.map((m) => ({
        messageId: m.messageId,
        authorId: m.authorId,
        authorName: m.authorName,
        text: m.text,
        isStaff: m.isStaff,
        sentAt: new Date(m.sentAt),
      })),
      assignedToAgent: ticket.assignedToAgent,
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
    })

    const updated = entity.addMessage(authorId, authorName, dto.text, isStaff)
    const finalStatus = dto.status ? dto.status : updated.status
    const resolvedAt = finalStatus === 'RESOLVED' ? new Date() : updated.resolvedAt

    const saved = await this.repository.updateTicket(id, {
      status: finalStatus,
      messages: updated.messages,
      resolvedAt,
    })

    if (!saved) {
      throw new NotFoundException('Chamado de suporte não encontrado')
    }

    await this.externalService.notifyTicketUpdated(saved)

    return saved
  }

  // ----------------- BIGA ADMIN & LICENSING -----------------

  async listTenantsForAdmin(): Promise<
    ReadonlyArray<{
      tenantId: string
      displayName: string
      enabledModules: readonly string[]
      isWhiteLabelConfigured: boolean
    }>
  > {
    const sampleTenants = [
      this.tenantContext.tenantId,
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    ]

    const uniqueTenants = Array.from(new Set(sampleTenants))
    const results: Array<{
      tenantId: string
      displayName: string
      enabledModules: readonly string[]
      isWhiteLabelConfigured: boolean
    }> = []

    for (const tId of uniqueTenants) {
      const config = await this.ecosystemRepo.findTenantConfig(tId)
      results.push({
        tenantId: tId,
        displayName: config?.displayName ?? 'Tenant Padrão',
        enabledModules: config?.enabledModules ?? ['VEHICLES', 'TRIPS', 'MAINTENANCE'],
        isWhiteLabelConfigured: Boolean(config),
      })
    }

    return Object.freeze(results)
  }

  async updateTenantLicenses(
    tenantId: string,
    dto: UpdateTenantLicensesDto,
  ): Promise<Readonly<TenantCustomizationInternalDto>> {
    const existing = await this.ecosystemRepo.findTenantConfig(tenantId)

    const updated = await this.ecosystemRepo.saveTenantConfig(
      new SaveTenantConfigInternalDto({
        tenantId,
        displayName: existing?.displayName ?? 'Biga Fleet Client',
        logoUrl: existing?.logoUrl ?? null,
        primaryColor: existing?.primaryColor ?? '#1E3A8A',
        secondaryColor: existing?.secondaryColor ?? '#3B82F6',
        enabledModules: dto.enabledModules,
        customTerminology: existing?.customTerminology ?? {},
        createdAt: existing ? new Date(existing.createdAt) : new Date(),
        updatedAt: new Date(),
      }),
    )

    await this.externalService.notifyLicensesUpdated(tenantId, dto.enabledModules)

    return updated
  }

  // ----------------- DYNAMIC MARKETPLACE -----------------

  async getMarketplaceCatalog(): Promise<MarketplaceCatalogDto> {
    const integrations: MarketplaceIntegrationItem[] = [
      {
        id: 'int-erp-sap',
        name: 'SAP Logistics & ERP Dispatch',
        description: 'Sincronização de viagens, notas fiscais e custos de combustível.',
        category: 'ERP & Faturamento',
        icon: 'database',
        requiredModule: 'TRIPS',
        apiDocsUrl: '/api/docs#tag/Trips',
        status: 'AVAILABLE',
      },
      {
        id: 'int-totvs-manutencao',
        name: 'TOTVS / Protheus Manutenção',
        description: 'Ordens de serviço preventivas e corretivas com apontamento de oficina.',
        category: 'Manutenção',
        icon: 'tool',
        requiredModule: 'MAINTENANCE',
        apiDocsUrl: '/api/docs#tag/Maintenance',
        status: 'AVAILABLE',
      },
      {
        id: 'int-sem-parar',
        name: 'Sem Parar / Veloe / ConectCar',
        description: 'Captura em tempo real de passagens em praças de pedágio.',
        category: 'Pedágios & Sinistros',
        icon: 'credit-card',
        requiredModule: 'INCIDENTS_TOLLS',
        apiDocsUrl: '/api/docs#tag/Incidents-&-Tolls',
        status: 'AVAILABLE',
      },
      {
        id: 'int-here-fleet',
        name: 'HERE Fleet & OSRM Routing',
        description: 'Roteirização com restrição de altura de viadutos e peso bruto por eixo.',
        category: 'Roteirização',
        icon: 'compass',
        requiredModule: 'ROUTE_PLANNING',
        apiDocsUrl: '/api/docs#tag/Route-Planning',
        status: 'AVAILABLE',
      },
      {
        id: 'int-iot-telemetry',
        name: 'Protocolo de Telemetria Multimarcas (Suntech, Queclink, Teltonika)',
        description: 'Recepção e decodificação de pacotes brutos telemáticos via Redis.',
        category: 'IoT & Telemetria',
        icon: 'radio',
        requiredModule: 'TELEMETRY',
        apiDocsUrl: '/api/docs#tag/Ingestion',
        status: 'ACTIVE',
      },
    ]

    return Promise.resolve({
      title: 'Loja de Integrações e Plugins Biga Fleet',
      version: '1.0.0',
      openApiSpecUrl: '/api/docs-json',
      integrations,
    })
  }
}

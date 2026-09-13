import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PortalInternalService } from './portal.internal.service.js'
import type { PortalRepository } from '../repositories/portal.repository.js'
import type { PlatformEcosystemRepository } from '../../ecosystem/repositories/platform-ecosystem.repository.js'
import type { PortalExternalService } from './portal.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { TenantCustomizationInternalDto } from '../../ecosystem/dtos/internal/tenant-customization.internal.dto.js'
import { RoleInternalDto } from '../dtos/internal/role.internal.dto.js'
import {
  OnboardingJourneyInternalDto,
  OnboardingStepInternalDto,
} from '../dtos/internal/onboarding-journey.internal.dto.js'
import { SupportTicketInternalDto } from '../dtos/internal/support-ticket.internal.dto.js'

describe('PortalInternalService', () => {
  let service: PortalInternalService
  let mockRepository: {
    createRole: ReturnType<typeof vi.fn>
    findRoleById: ReturnType<typeof vi.fn>
    findRoles: ReturnType<typeof vi.fn>
    findOnboardingJourney: ReturnType<typeof vi.fn>
    saveOnboardingJourney: ReturnType<typeof vi.fn>
    createTicket: ReturnType<typeof vi.fn>
    findTicketById: ReturnType<typeof vi.fn>
    findTickets: ReturnType<typeof vi.fn>
    updateTicket: ReturnType<typeof vi.fn>
  }
  let mockEcosystemRepo: {
    findTenantConfig: ReturnType<typeof vi.fn>
    saveTenantConfig: ReturnType<typeof vi.fn>
  }
  let mockExternalService: {
    notifyTicketOpened: ReturnType<typeof vi.fn>
    notifyTicketUpdated: ReturnType<typeof vi.fn>
    notifyOnboardingStepUpdated: ReturnType<typeof vi.fn>
    notifyLicensesUpdated: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'

  const sampleTenantConfig = new TenantCustomizationInternalDto({
    tenantId,
    displayName: 'AgroTrans Logística',
    logoUrl: 'https://cdn.example.com/logo.png',
    primaryColor: '#047857',
    secondaryColor: '#10B981',
    enabledModules: ['VEHICLES', 'TRIPS', 'MAINTENANCE'],
    customTerminology: {},
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  const sampleRole = new RoleInternalDto({
    id: 'role-mechanic',
    tenantId,
    name: 'Mecânico de Pátio',
    description: 'Acesso restrito a manutenções',
    permissions: ['fleet:maintenance:*', 'portal:support:read'],
    isSystemDefault: false,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  const sampleOnboarding = new OnboardingJourneyInternalDto({
    id: 'onb-001',
    tenantId,
    currentStepIndex: 1,
    progressPercentage: 0,
    steps: [
      new OnboardingStepInternalDto({
        stepIndex: 1,
        code: 'TENANT_WHITE_LABEL',
        title: 'White-Label',
        status: 'IN_PROGRESS',
      }),
      new OnboardingStepInternalDto({
        stepIndex: 2,
        code: 'FLEET_REGISTRATION',
        title: 'Frota',
        status: 'PENDING',
      }),
      new OnboardingStepInternalDto({
        stepIndex: 3,
        code: 'TELEMETRY_HOMOLOGATION',
        title: 'Telemetria',
        status: 'PENDING',
      }),
      new OnboardingStepInternalDto({
        stepIndex: 4,
        code: 'DRIVERS_AND_ALERTS',
        title: 'Motoristas',
        status: 'PENDING',
      }),
      new OnboardingStepInternalDto({
        stepIndex: 5,
        code: 'COMPLETION_DASHBOARD',
        title: 'Conclusão',
        status: 'PENDING',
      }),
    ],
    isCompleted: false,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  const sampleTicket = new SupportTicketInternalDto({
    id: 'tkt-001',
    tenantId,
    openedByUserId: 'usr-001',
    title: 'Falha na homologação do rastreador',
    description: 'Veículo ROM1001 não está enviando coordenadas',
    category: 'TECHNICAL',
    priority: 'HIGH',
    status: 'OPEN',
    messages: [
      {
        messageId: 'msg-1',
        authorId: 'usr-001',
        authorName: 'Operador',
        text: 'Veículo ROM1001 não está enviando coordenadas',
        isStaff: false,
        sentAt: '2026-09-12T10:00:00Z',
      },
    ],
    assignedToAgent: null,
    resolvedAt: null,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  beforeEach(() => {
    mockRepository = {
      createRole: vi.fn(),
      findRoleById: vi.fn(),
      findRoles: vi.fn(),
      findOnboardingJourney: vi.fn(),
      saveOnboardingJourney: vi.fn(),
      createTicket: vi.fn(),
      findTicketById: vi.fn(),
      findTickets: vi.fn(),
      updateTicket: vi.fn(),
    }

    mockEcosystemRepo = {
      findTenantConfig: vi.fn(),
      saveTenantConfig: vi.fn(),
    }

    mockExternalService = {
      notifyTicketOpened: vi.fn().mockResolvedValue(undefined),
      notifyTicketUpdated: vi.fn().mockResolvedValue(undefined),
      notifyOnboardingStepUpdated: vi.fn().mockResolvedValue(undefined),
      notifyLicensesUpdated: vi.fn().mockResolvedValue(undefined),
    }

    mockTenantContext = {
      tenantId,
    }

    service = new PortalInternalService(
      mockRepository as unknown as PortalRepository,
      mockEcosystemRepo as unknown as PlatformEcosystemRepository,
      mockExternalService as unknown as PortalExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('getUserMenuTree (RBAC & Dynamic Menus)', () => {
    it('deve gerar árvore de menus respeitando módulos ativos e permissões do papel', async () => {
      mockEcosystemRepo.findTenantConfig.mockResolvedValue(sampleTenantConfig)
      mockRepository.findRoleById.mockResolvedValue(sampleRole)

      const menuTree = await service.getUserMenuTree('role-mechanic')

      expect(menuTree.branding.displayName).toBe('AgroTrans Logística')
      expect(menuTree.roleName).toBe('Mecânico de Pátio')

      const paths = menuTree.items.map((i) => i.path)
      // O papel de mecânico só tem permissão fleet:maintenance:* e portal core
      expect(paths).toContain('/app/maintenance')
      // Não deve ter acesso a veículos (fleet:vehicles:read)
      expect(paths).not.toContain('/app/fleet')
      // Módulo ROUTE_PLANNING não está contratado em sampleTenantConfig
      expect(paths).not.toContain('/app/routes')
    })

    it('deve liberar todos os módulos contratados para papel administrador (*)', async () => {
      mockEcosystemRepo.findTenantConfig.mockResolvedValue(sampleTenantConfig)

      const menuTree = await service.getUserMenuTree(undefined) // sem roleId = admin default

      const paths = menuTree.items.map((i) => i.path)
      expect(paths).toContain('/app/fleet')
      expect(paths).toContain('/app/trips')
      expect(paths).toContain('/app/maintenance')
      expect(paths).toContain('/app/onboarding')
    })
  })

  describe('createRole & listRoles', () => {
    it('deve criar um papel de acesso customizado com permissões sem duplicação', async () => {
      mockRepository.createRole.mockImplementation((dto) => {
        return Promise.resolve(
          new RoleInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            name: dto.name,
            description: dto.description ?? '',
            permissions: dto.permissions,
            isSystemDefault: false,
            createdAt: '2026-09-12T10:00:00Z',
            updatedAt: '2026-09-12T10:00:00Z',
          }),
        )
      })

      const result = await service.createRole({
        name: 'Gestor de Frotas',
        description: 'Acesso amplo à frota',
        permissions: ['fleet:vehicles:read', 'fleet:vehicles:write', 'fleet:vehicles:read'],
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('Gestor de Frotas')
      expect(result.permissions).toHaveLength(2) // deduplicado
      expect(mockRepository.createRole).toHaveBeenCalledTimes(1)
    })

    it('deve rejeitar papel sem permissões atribuídas', async () => {
      await expect(
        service.createRole({
          name: 'Papel Vazio',
          permissions: [],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException (PORTAL-0002) se papel não existir', async () => {
      mockRepository.findRoleById.mockResolvedValue(null)

      await expect(service.getRoleById('inexistente')).rejects.toThrow(NotFoundException)
    })
  })

  describe('Onboarding Journey', () => {
    it('deve inicializar nova jornada de 5 etapas se nenhuma existir para o tenant', async () => {
      mockRepository.findOnboardingJourney.mockResolvedValue(null)
      mockRepository.saveOnboardingJourney.mockImplementation((dto) => {
        return Promise.resolve(
          new OnboardingJourneyInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            currentStepIndex: dto.currentStepIndex,
            progressPercentage: 0,
            steps: dto.steps.map(
              (s: { stepIndex: number; code: string; title: string; status: string }) =>
                new OnboardingStepInternalDto({
                  stepIndex: s.stepIndex,
                  code: s.code,
                  title: s.title,
                  status: s.status as any,
                }),
            ),
            isCompleted: false,
            createdAt: '2026-09-12T10:00:00Z',
            updatedAt: '2026-09-12T10:00:00Z',
          }),
        )
      })

      const journey = await service.getOnboardingJourney()

      expect(journey.steps).toHaveLength(5)
      expect(journey.steps[0].status).toBe('IN_PROGRESS')
      expect(journey.progressPercentage).toBe(0)
    })

    it('deve avançar etapa de onboarding, recalcular percentual e emitir evento', async () => {
      mockRepository.findOnboardingJourney.mockResolvedValue(sampleOnboarding)
      mockRepository.saveOnboardingJourney.mockImplementation((dto) => {
        return Promise.resolve(
          new OnboardingJourneyInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            currentStepIndex: dto.currentStepIndex,
            progressPercentage: 20,
            steps: dto.steps.map(
              (s: { stepIndex: number; code: string; title: string; status: string }) =>
                new OnboardingStepInternalDto({
                  stepIndex: s.stepIndex,
                  code: s.code,
                  title: s.title,
                  status: s.status as any,
                }),
            ),
            isCompleted: false,
            createdAt: '2026-09-12T10:00:00Z',
            updatedAt: '2026-09-12T10:00:00Z',
          }),
        )
      })

      const updated = await service.updateOnboardingStep(1, {
        status: 'COMPLETED',
        metadata: { primaryColor: '#1E3A8A' },
      })

      expect(updated).toBeDefined()
      expect(mockExternalService.notifyOnboardingStepUpdated).toHaveBeenCalledWith(
        tenantId,
        1,
        'COMPLETED',
      )
    })

    it('deve lançar erro se tentar atualizar etapa fora da faixa de 1 a 5', async () => {
      mockRepository.findOnboardingJourney.mockResolvedValue(sampleOnboarding)

      await expect(service.updateOnboardingStep(9, { status: 'COMPLETED' })).rejects.toThrow()
    })
  })

  describe('Support Tickets', () => {
    it('deve abrir chamado de suporte técnico e notificar via evento', async () => {
      mockRepository.createTicket.mockImplementation((dto) => {
        return Promise.resolve(
          new SupportTicketInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            openedByUserId: dto.openedByUserId,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            priority: dto.priority,
            status: dto.status,
            messages: dto.messages.map((m: any) => ({
              ...m,
              sentAt: m.sentAt.toISOString(),
            })),
            createdAt: '2026-09-12T10:00:00Z',
            updatedAt: '2026-09-12T10:00:00Z',
          }),
        )
      })

      const ticket = await service.createSupportTicket({
        title: 'Dúvida na rota de colheitadeira',
        description: 'Como permitir vias de terra no perfil agrícola?',
        category: 'INTEGRATION',
        priority: 'MEDIUM',
      })

      expect(ticket).toBeDefined()
      expect(ticket.title).toBe('Dúvida na rota de colheitadeira')
      expect(ticket.status).toBe('OPEN')
      expect(mockExternalService.notifyTicketOpened).toHaveBeenCalledTimes(1)
    })

    it('deve responder chamado de suporte e atualizar status', async () => {
      mockRepository.findTicketById.mockResolvedValue(sampleTicket)
      mockRepository.updateTicket.mockImplementation((_id, update) => {
        return Promise.resolve(
          new SupportTicketInternalDto({
            ...sampleTicket,
            status: update.status ?? sampleTicket.status,
            messages: (update.messages ?? sampleTicket.messages).map((m: any) => ({
              ...m,
              sentAt: m.sentAt instanceof Date ? m.sentAt.toISOString() : m.sentAt,
            })),
          }),
        )
      })

      const result = await service.replySupportTicket('tkt-001', {
        text: 'Ajustamos a configuração de telemetria no servidor.',
        status: 'RESOLVED',
      })

      expect(result.status).toBe('RESOLVED')
      expect(result.messages.length).toBeGreaterThan(1)
      expect(mockExternalService.notifyTicketUpdated).toHaveBeenCalledTimes(1)
    })

    it('deve lançar NotFoundException (PORTAL-0003) se chamado não existir', async () => {
      mockRepository.findTicketById.mockResolvedValue(null)

      await expect(service.getSupportTicketById('inexistente')).rejects.toThrow(NotFoundException)
    })
  })

  describe('Biga Admin Licensing & Marketplace Catalog', () => {
    it('deve atualizar licenças de módulos do tenant pelo painel admin', async () => {
      mockEcosystemRepo.findTenantConfig.mockResolvedValue(sampleTenantConfig)
      mockEcosystemRepo.saveTenantConfig.mockImplementation((dto) => {
        return Promise.resolve(
          new TenantCustomizationInternalDto({
            ...sampleTenantConfig,
            enabledModules: dto.enabledModules,
          }),
        )
      })

      const result = await service.updateTenantLicenses(tenantId, {
        enabledModules: ['VEHICLES', 'TRIPS', 'MAINTENANCE', 'ROUTE_PLANNING'],
      })

      expect(result.enabledModules).toContain('ROUTE_PLANNING')
      expect(mockExternalService.notifyLicensesUpdated).toHaveBeenCalledWith(
        tenantId,
        expect.arrayContaining(['ROUTE_PLANNING']),
      )
    })

    it('deve retornar catálogo Swagger-Driven para o Marketplace', async () => {
      const catalog = await service.getMarketplaceCatalog()

      expect(catalog.title).toBeDefined()
      expect(catalog.integrations.length).toBeGreaterThan(0)
      expect(catalog.openApiSpecUrl).toBe('/api/docs-json')
    })
  })
})

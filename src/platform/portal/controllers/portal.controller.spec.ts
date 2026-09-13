import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PortalController } from './portal.controller.js'
import type { PortalInternalService } from '../services/portal.internal.service.js'

describe('PortalController', () => {
  let controller: PortalController
  let internalService: Partial<Record<keyof PortalInternalService, ReturnType<typeof vi.fn>>>

  beforeEach(() => {
    internalService = {
      getUserMenuTree: vi.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        roleName: 'Admin',
        branding: { displayName: 'Biga Fleet' },
        items: [],
      }),
      createRole: vi.fn().mockResolvedValue({
        id: 'role-1',
        name: 'Gestor de Frotas',
        permissions: ['fleet:vehicles:read'],
      }),
      listRoles: vi.fn().mockResolvedValue([{ id: 'role-1', name: 'Gestor' }]),
      getRoleById: vi.fn().mockResolvedValue({
        id: 'role-1',
        name: 'Gestor',
      }),
      getOnboardingJourney: vi.fn().mockResolvedValue({
        id: 'journey-1',
        currentStepIndex: 1,
        steps: [],
        isCompleted: false,
      }),
      updateOnboardingStep: vi.fn().mockResolvedValue({
        id: 'journey-1',
        currentStepIndex: 2,
        steps: [],
        isCompleted: false,
      }),
      createSupportTicket: vi.fn().mockResolvedValue({
        id: 'tkt-1',
        title: 'Ajuda com rastreador',
        status: 'OPEN',
      }),
      listSupportTickets: vi
        .fn()
        .mockResolvedValue([{ id: 'tkt-1', title: 'Ajuda com rastreador' }]),
      getSupportTicketById: vi.fn().mockResolvedValue({
        id: 'tkt-1',
        title: 'Ajuda com rastreador',
        messages: [],
      }),
      replySupportTicket: vi.fn().mockResolvedValue({
        id: 'tkt-1',
        status: 'RESOLVED',
      }),
      listTenantsForAdmin: vi
        .fn()
        .mockResolvedValue([
          { tenantId: 't-1', displayName: 'Transportadora ABC', enabledModules: ['VEHICLES'] },
        ]),
      updateTenantLicenses: vi.fn().mockResolvedValue({
        tenantId: 't-1',
        enabledModules: ['VEHICLES', 'TRIPS'],
      }),
      getMarketplaceCatalog: vi.fn().mockResolvedValue({
        title: 'Loja Biga',
        integrations: [],
      }),
    }

    controller = new PortalController(internalService as unknown as PortalInternalService)
  })

  it('deve delegar chamada de obtenção da árvore de menus dinâmicos', async () => {
    const res = await controller.getUserMenuTree('role-admin')
    expect(internalService.getUserMenuTree).toHaveBeenCalledWith('role-admin')
    expect(res).toHaveProperty('tenantId', 'tenant-1')
  })

  it('deve delegar cadastro de novo perfil de acesso', async () => {
    const dto = {
      name: 'Gestor de Frotas',
      description: 'Acesso a veículos',
      permissions: ['fleet:vehicles:read'],
    }
    const res = await controller.createRole(dto)
    expect(internalService.createRole).toHaveBeenCalledWith(dto)
    expect(res).toHaveProperty('id', 'role-1')
  })

  it('deve delegar listagem de perfis de acesso', async () => {
    const res = await controller.listRoles()
    expect(internalService.listRoles).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('deve delegar consulta de perfil por ID', async () => {
    const res = await controller.getRoleById('role-1')
    expect(internalService.getRoleById).toHaveBeenCalledWith('role-1')
    expect(res).toHaveProperty('id', 'role-1')
  })

  it('deve delegar consulta de jornada de onboarding', async () => {
    const res = await controller.getOnboardingJourney()
    expect(internalService.getOnboardingJourney).toHaveBeenCalled()
    expect(res).toHaveProperty('currentStepIndex', 1)
  })

  it('deve delegar atualização de etapa de onboarding', async () => {
    const dto = { status: 'COMPLETED' as const, metadata: { notes: 'Feito' } }
    const res = await controller.updateOnboardingStep(1, dto)
    expect(internalService.updateOnboardingStep).toHaveBeenCalledWith(1, dto)
    expect(res).toHaveProperty('currentStepIndex', 2)
  })

  it('deve delegar abertura de chamado de suporte', async () => {
    const dto = {
      title: 'Ajuda com rastreador',
      description: 'Equipamento sem sinal',
      category: 'DEVICE_INTEGRATION' as const,
      priority: 'HIGH' as const,
    }
    const res = await controller.createSupportTicket(dto)
    expect(internalService.createSupportTicket).toHaveBeenCalledWith(dto)
    expect(res).toHaveProperty('id', 'tkt-1')
  })

  it('deve delegar listagem de chamados com filtros', async () => {
    const res = await controller.listSupportTickets('OPEN', 'DEVICE_INTEGRATION')
    expect(internalService.listSupportTickets).toHaveBeenCalledWith(
      undefined,
      'OPEN',
      'DEVICE_INTEGRATION',
    )
    expect(res).toHaveLength(1)
  })

  it('deve delegar consulta de ticket por ID', async () => {
    const res = await controller.getSupportTicketById('tkt-1')
    expect(internalService.getSupportTicketById).toHaveBeenCalledWith('tkt-1')
    expect(res).toHaveProperty('id', 'tkt-1')
  })

  it('deve delegar resposta e atualização de chamado', async () => {
    const dto = { text: 'Resolvido com sucesso', status: 'RESOLVED' as const }
    const res = await controller.replySupportTicket('tkt-1', dto)
    expect(internalService.replySupportTicket).toHaveBeenCalledWith('tkt-1', dto)
    expect(res).toHaveProperty('status', 'RESOLVED')
  })

  it('deve delegar listagem de tenants para Biga Admin', async () => {
    const res = await controller.listTenantsForAdmin()
    expect(internalService.listTenantsForAdmin).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('deve delegar atualização de licenciamento para Biga Admin', async () => {
    const dto = { enabledModules: ['VEHICLES', 'TRIPS'] as const }
    const res = await controller.updateTenantLicenses('t-1', dto)
    expect(internalService.updateTenantLicenses).toHaveBeenCalledWith('t-1', dto)
    expect(res).toHaveProperty('tenantId', 't-1')
  })

  it('deve delegar consulta de catálogo do marketplace', async () => {
    const res = await controller.getMarketplaceCatalog()
    expect(internalService.getMarketplaceCatalog).toHaveBeenCalled()
    expect(res).toHaveProperty('title', 'Loja Biga')
  })
})

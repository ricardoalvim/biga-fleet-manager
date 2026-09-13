import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PlatformEcosystemInternalService } from './platform-ecosystem.internal.service.js'
import type { PlatformEcosystemRepository } from '../repositories/platform-ecosystem.repository.js'
import type { PlatformEcosystemExternalService } from './platform-ecosystem.external.service.js'
import type { TenantContext } from '../../../tenancy/tenant.context.js'
import { WebhookSubscriptionInternalDto } from '../dtos/internal/webhook-subscription.internal.dto.js'
import { TenantCustomizationInternalDto } from '../dtos/internal/tenant-customization.internal.dto.js'

describe('PlatformEcosystemInternalService', () => {
  let service: PlatformEcosystemInternalService
  let mockRepository: {
    createWebhook: ReturnType<typeof vi.fn>
    findWebhookById: ReturnType<typeof vi.fn>
    findWebhooks: ReturnType<typeof vi.fn>
    findActiveWebhooksForEvent: ReturnType<typeof vi.fn>
    updateWebhookTriggerResult: ReturnType<typeof vi.fn>
    deleteWebhook: ReturnType<typeof vi.fn>
    findTenantConfig: ReturnType<typeof vi.fn>
    saveTenantConfig: ReturnType<typeof vi.fn>
  }
  let mockExternalService: {
    sendWebhook: ReturnType<typeof vi.fn>
    notifyPlatformAudit: ReturnType<typeof vi.fn>
  }
  let mockTenantContext: Partial<TenantContext>

  const tenantId = '00000000-0000-4000-8000-000000000001'
  const webhookId = 'wh-001'

  const sampleWebhook = new WebhookSubscriptionInternalDto({
    id: webhookId,
    tenantId,
    name: 'ERP Integration',
    targetUrl: 'https://api.erp.example.com/webhooks',
    subscribedEvents: ['trip.finished', 'incident.registered'],
    secretToken: 'whsec_valid_token_1234567890abcdef',
    status: 'ACTIVE',
    failureCount: 0,
    lastTriggeredAt: null,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  const sampleTenantConfig = new TenantCustomizationInternalDto({
    tenantId,
    displayName: 'AgroTrans Logística',
    logoUrl: 'https://cdn.example.com/logo.png',
    primaryColor: '#047857',
    secondaryColor: '#10B981',
    enabledModules: ['VEHICLES', 'TRIPS', 'MAINTENANCE'],
    customTerminology: {
      stopPointLabel: 'Talhão',
      assetLabel: 'Trator',
    },
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  beforeEach(() => {
    mockRepository = {
      createWebhook: vi.fn(),
      findWebhookById: vi.fn(),
      findWebhooks: vi.fn(),
      findActiveWebhooksForEvent: vi.fn(),
      updateWebhookTriggerResult: vi.fn(),
      deleteWebhook: vi.fn(),
      findTenantConfig: vi.fn(),
      saveTenantConfig: vi.fn(),
    }

    mockExternalService = {
      sendWebhook: vi.fn().mockResolvedValue({
        success: true,
        statusCode: 200,
        deliveryId: 'del-123',
      }),
      notifyPlatformAudit: vi.fn().mockResolvedValue(undefined),
    }

    mockTenantContext = {
      tenantId,
    }

    service = new PlatformEcosystemInternalService(
      mockRepository as unknown as PlatformEcosystemRepository,
      mockExternalService as unknown as PlatformEcosystemExternalService,
      mockTenantContext as TenantContext,
    )
  })

  describe('registerWebhook', () => {
    it('deve registrar webhook e gerar secretToken seguro automaticamente se não fornecido', async () => {
      mockRepository.createWebhook.mockImplementation((dto) => {
        return Promise.resolve(
          new WebhookSubscriptionInternalDto({
            id: dto.id,
            tenantId: dto.tenantId,
            name: dto.name,
            targetUrl: dto.targetUrl,
            subscribedEvents: dto.subscribedEvents,
            secretToken: dto.secretToken,
            status: dto.status,
            failureCount: dto.failureCount,
            createdAt: dto.createdAt.toISOString(),
            updatedAt: dto.updatedAt.toISOString(),
          }),
        )
      })

      const result = await service.registerWebhook({
        name: 'SAP Dispatch Hub',
        targetUrl: 'https://sap.corporativo.com.br/api/events',
        subscribedEvents: ['trip.finished'],
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('SAP Dispatch Hub')
      expect(result.secretToken).toMatch(/^whsec_[a-f0-9]{40}$/)
      expect(result.status).toBe('ACTIVE')
      expect(mockRepository.createWebhook).toHaveBeenCalledTimes(1)
    })

    it('deve rejeitar registro com URL inválida', async () => {
      await expect(
        service.registerWebhook({
          name: 'Invalid Webhook',
          targetUrl: 'ftp://invalid-url.com',
          subscribedEvents: ['trip.finished'],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve rejeitar registro com lista de eventos vazia', async () => {
      await expect(
        service.registerWebhook({
          name: 'Empty Events',
          targetUrl: 'https://valid.com/events',
          subscribedEvents: [],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve rejeitar registro se o segredo for muito curto (< 16 caracteres)', async () => {
      await expect(
        service.registerWebhook({
          name: 'Short Secret',
          targetUrl: 'https://valid.com/events',
          subscribedEvents: ['trip.finished'],
          secretToken: 'short_key',
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('getWebhookById & listWebhooks', () => {
    it('deve retornar webhook por ID para o tenant informado', async () => {
      mockRepository.findWebhookById.mockResolvedValue(sampleWebhook)

      const result = await service.getWebhookById(webhookId)

      expect(result).toEqual(sampleWebhook)
      expect(mockRepository.findWebhookById).toHaveBeenCalledWith(tenantId, webhookId)
    })

    it('deve lançar NotFoundException (PLATFORM-0001) se webhook não for encontrado', async () => {
      mockRepository.findWebhookById.mockResolvedValue(null)

      await expect(service.getWebhookById('inexistente')).rejects.toThrow(NotFoundException)
    })

    it('deve listar webhooks do tenant com filtros', async () => {
      mockRepository.findWebhooks.mockResolvedValue([sampleWebhook])

      const result = await service.listWebhooks(tenantId, { status: 'ACTIVE' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findWebhooks).toHaveBeenCalledWith(tenantId, { status: 'ACTIVE' })
    })
  })

  describe('deleteWebhook', () => {
    it('deve remover webhook existente', async () => {
      mockRepository.findWebhookById.mockResolvedValue(sampleWebhook)
      mockRepository.deleteWebhook.mockResolvedValue(true)

      const result = await service.deleteWebhook(webhookId)

      expect(result.deleted).toBe(true)
      expect(mockRepository.deleteWebhook).toHaveBeenCalledWith(tenantId, webhookId)
    })

    it('deve lançar NotFoundException ao tentar deletar webhook inexistente', async () => {
      mockRepository.findWebhookById.mockResolvedValue(null)

      await expect(service.deleteWebhook('inexistente')).rejects.toThrow(NotFoundException)
    })
  })

  describe('testWebhook', () => {
    it('deve disparar evento de teste e registrar sucesso no repositório', async () => {
      mockRepository.findWebhookById.mockResolvedValue(sampleWebhook)
      mockRepository.updateWebhookTriggerResult.mockResolvedValue(sampleWebhook)

      const result = await service.testWebhook(webhookId)

      expect(result.success).toBe(true)
      expect(mockExternalService.sendWebhook).toHaveBeenCalledWith(
        sampleWebhook,
        'platform.webhook_tested',
        expect.any(Object),
      )
      expect(mockRepository.updateWebhookTriggerResult).toHaveBeenCalledWith(
        tenantId,
        webhookId,
        true,
      )
    })
  })

  describe('dispatchWebhookEvent', () => {
    it('deve despachar eventos para todos os webhooks ativos inscritos', async () => {
      mockRepository.findActiveWebhooksForEvent.mockResolvedValue([sampleWebhook])

      const result = await service.dispatchWebhookEvent(tenantId, 'trip.finished', {
        tripId: '100',
      })

      expect(result.dispatchedCount).toBe(1)
      expect(mockExternalService.sendWebhook).toHaveBeenCalledWith(sampleWebhook, 'trip.finished', {
        tripId: '100',
      })
    })
  })

  describe('Tenant Customization (White-Label)', () => {
    it('deve retornar configurações White-Label existentes do tenant', async () => {
      mockRepository.findTenantConfig.mockResolvedValue(sampleTenantConfig)

      const result = await service.getTenantConfig()

      expect(result.displayName).toBe('AgroTrans Logística')
      expect(result.primaryColor).toBe('#047857')
    })

    it('deve retornar configuração padrão amigável para tenant sem customização prévia', async () => {
      mockRepository.findTenantConfig.mockResolvedValue(null)

      const result = await service.getTenantConfig('tenant-novo')

      expect(result.displayName).toBe('Biga Fleet Manager')
      expect(result.primaryColor).toBe('#1E3A8A')
      expect(result.enabledModules.length).toBeGreaterThan(0)
    })

    it('deve atualizar branding White-Label do tenant com cores em maiúsculo', async () => {
      mockRepository.saveTenantConfig.mockImplementation((dto) => {
        return Promise.resolve(
          new TenantCustomizationInternalDto({
            tenantId: dto.tenantId,
            displayName: dto.displayName,
            logoUrl: dto.logoUrl,
            primaryColor: dto.primaryColor,
            secondaryColor: dto.secondaryColor,
            enabledModules: dto.enabledModules,
            customTerminology: dto.customTerminology,
            createdAt: dto.createdAt.toISOString(),
            updatedAt: dto.updatedAt.toISOString(),
          }),
        )
      })

      const result = await service.updateTenantConfig({
        displayName: 'Minha Frota Express',
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      })

      expect(result.displayName).toBe('Minha Frota Express')
      expect(result.primaryColor).toBe('#FF0000')
      expect(result.secondaryColor).toBe('#00FF00')
      expect(mockRepository.saveTenantConfig).toHaveBeenCalledTimes(1)
    })

    it('deve rejeitar cores fora do padrão hexadecimal', async () => {
      await expect(
        service.updateTenantConfig({
          displayName: 'Minha Frota',
          primaryColor: 'azul-marinho',
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })
})

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import * as crypto from 'crypto'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { WebhookSubscriptionEntity } from '../entities/webhook-subscription.entity.js'
import {
  TenantCustomizationEntity,
  DEFAULT_ENABLED_MODULES,
} from '../entities/tenant-customization.entity.js'
import { CreateWebhookInternalDto } from '../dtos/internal/create-webhook.internal.dto.js'
import { WebhookSubscriptionInternalDto } from '../dtos/internal/webhook-subscription.internal.dto.js'
import { SaveTenantConfigInternalDto } from '../dtos/internal/save-tenant-config.internal.dto.js'
import { TenantCustomizationInternalDto } from '../dtos/internal/tenant-customization.internal.dto.js'
import type { RegisterWebhookDto } from '../dtos/external/register-webhook.dto.js'
import type { UpdateTenantConfigDto } from '../dtos/external/update-tenant-config.dto.js'
import {
  PlatformEcosystemRepository,
  type WebhookFilterOptions,
} from '../repositories/platform-ecosystem.repository.js'
import {
  PlatformEcosystemExternalService,
  type WebhookDispatchResult,
} from './platform-ecosystem.external.service.js'

@Injectable()
export class PlatformEcosystemInternalService {
  constructor(
    private readonly repository: PlatformEcosystemRepository,
    private readonly externalService: PlatformEcosystemExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  async registerWebhook(
    dto: RegisterWebhookDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<WebhookSubscriptionInternalDto>> {
    const secretToken = dto.secretToken ?? `whsec_${crypto.randomBytes(20).toString('hex')}`

    let entity: WebhookSubscriptionEntity
    try {
      entity = new WebhookSubscriptionEntity({
        id: crypto.randomUUID(),
        tenantId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        subscribedEvents: dto.subscribedEvents,
        secretToken,
        status: 'ACTIVE',
        failureCount: 0,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    const internalDto = new CreateWebhookInternalDto({
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      targetUrl: entity.targetUrl,
      subscribedEvents: entity.subscribedEvents,
      secretToken: entity.secretToken,
      status: entity.status,
      failureCount: entity.failureCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    })

    return this.repository.createWebhook(internalDto)
  }

  async getWebhookById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<WebhookSubscriptionInternalDto>> {
    const webhook = await this.repository.findWebhookById(tenantId, id)
    if (!webhook) {
      throw new NotFoundException('Webhook não encontrado para o tenant informado', {
        errorCode: 'PLATFORM-0001',
      })
    }
    return webhook
  }

  async listWebhooks(
    tenantId = this.tenantContext.tenantId,
    filters?: WebhookFilterOptions,
  ): Promise<ReadonlyArray<Readonly<WebhookSubscriptionInternalDto>>> {
    return this.repository.findWebhooks(tenantId, filters)
  }

  async deleteWebhook(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<{ deleted: boolean }> {
    const webhook = await this.repository.findWebhookById(tenantId, id)
    if (!webhook) {
      throw new NotFoundException('Webhook não encontrado para o tenant informado', {
        errorCode: 'PLATFORM-0001',
      })
    }

    const deleted = await this.repository.deleteWebhook(tenantId, id)
    return { deleted }
  }

  async testWebhook(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<WebhookDispatchResult> {
    const webhook = await this.getWebhookById(id, tenantId)

    const testPayload = {
      message: 'Webhook test delivery from Biga Fleet Manager',
      triggeredAt: new Date().toISOString(),
    }

    const result = await this.externalService.sendWebhook(
      webhook,
      'platform.webhook_tested',
      testPayload,
    )

    await this.repository.updateWebhookTriggerResult(tenantId, id, result.success)

    return result
  }

  async dispatchWebhookEvent(
    tenantId: string,
    event: string,
    data: unknown,
  ): Promise<{ dispatchedCount: number }> {
    const activeWebhooks = await this.repository.findActiveWebhooksForEvent(tenantId, event)

    for (const webhook of activeWebhooks) {
      const result = await this.externalService.sendWebhook(webhook, event, data)
      await this.repository.updateWebhookTriggerResult(tenantId, webhook.id, result.success)
    }

    return { dispatchedCount: activeWebhooks.length }
  }

  async getTenantConfig(
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TenantCustomizationInternalDto>> {
    const config = await this.repository.findTenantConfig(tenantId)
    if (config) {
      return config
    }

    // Default configuration for new or uncustomized tenants
    return new TenantCustomizationInternalDto({
      tenantId,
      displayName: 'Biga Fleet Manager',
      logoUrl: null,
      primaryColor: '#1E3A8A',
      secondaryColor: '#3B82F6',
      enabledModules: DEFAULT_ENABLED_MODULES,
      customTerminology: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  async updateTenantConfig(
    dto: UpdateTenantConfigDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TenantCustomizationInternalDto>> {
    let entity: TenantCustomizationEntity
    try {
      entity = new TenantCustomizationEntity({
        tenantId,
        displayName: dto.displayName,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        enabledModules: dto.enabledModules,
        customTerminology: dto.customTerminology,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    const saveDto = new SaveTenantConfigInternalDto({
      tenantId: entity.tenantId,
      displayName: entity.displayName,
      logoUrl: entity.logoUrl,
      primaryColor: entity.primaryColor,
      secondaryColor: entity.secondaryColor,
      enabledModules: entity.enabledModules,
      customTerminology: entity.customTerminology,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    })

    return this.repository.saveTenantConfig(saveDto)
  }
}

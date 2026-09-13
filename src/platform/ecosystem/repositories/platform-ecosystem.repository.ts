import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WebhookSubscriptionDocument } from '../schemas/webhook-subscription.document.js'
import { TenantCustomizationDocument } from '../schemas/tenant-customization.document.js'
import type { WebhookStatus } from '../entities/webhook-subscription.entity.js'
import { WebhookSubscriptionInternalDto } from '../dtos/internal/webhook-subscription.internal.dto.js'
import type { CreateWebhookInternalDto } from '../dtos/internal/create-webhook.internal.dto.js'
import { TenantCustomizationInternalDto } from '../dtos/internal/tenant-customization.internal.dto.js'
import type { SaveTenantConfigInternalDto } from '../dtos/internal/save-tenant-config.internal.dto.js'

export interface WebhookFilterOptions {
  readonly status?: string
}

interface RawWebhookRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly name: string
  readonly targetUrl: string
  readonly subscribedEvents: ReadonlyArray<string>
  readonly secretToken: string
  readonly status: WebhookStatus
  readonly failureCount: number
  readonly lastTriggeredAt?: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

interface RawTenantConfigRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly displayName: string
  readonly logoUrl?: string | null
  readonly primaryColor: string
  readonly secondaryColor: string
  readonly enabledModules: ReadonlyArray<string>
  readonly customTerminology: Record<string, string>
  readonly createdAt: Date
  readonly updatedAt: Date
}

@Injectable()
export class PlatformEcosystemRepository {
  constructor(
    @InjectModel(WebhookSubscriptionDocument.name)
    private readonly webhookModel: Model<WebhookSubscriptionDocument>,
    @InjectModel(TenantCustomizationDocument.name)
    private readonly configModel: Model<TenantCustomizationDocument>,
  ) {}

  async createWebhook(
    dto: Readonly<CreateWebhookInternalDto>,
  ): Promise<Readonly<WebhookSubscriptionInternalDto>> {
    const doc = await this.webhookModel.create({
      _id: dto.id,
      tenantId: dto.tenantId,
      name: dto.name,
      targetUrl: dto.targetUrl,
      subscribedEvents: [...dto.subscribedEvents],
      secretToken: dto.secretToken,
      status: dto.status,
      failureCount: dto.failureCount,
    })

    return this.mapWebhookToDto(doc.toObject())
  }

  async findWebhookById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<WebhookSubscriptionInternalDto> | null> {
    const doc = await this.webhookModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapWebhookToDto(doc) : null
  }

  async findWebhooks(
    tenantId: string,
    filters?: WebhookFilterOptions,
  ): Promise<ReadonlyArray<Readonly<WebhookSubscriptionInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.status) {
      query.status = filters.status
    }

    const docs = await this.webhookModel.find(query).sort({ createdAt: -1 }).lean()
    return Object.freeze(docs.map((d) => this.mapWebhookToDto(d as unknown as RawWebhookRecord)))
  }

  async findActiveWebhooksForEvent(
    tenantId: string,
    event: string,
  ): Promise<ReadonlyArray<Readonly<WebhookSubscriptionInternalDto>>> {
    const docs = await this.webhookModel
      .find({
        tenantId,
        status: 'ACTIVE',
        $or: [{ subscribedEvents: '*' }, { subscribedEvents: event }],
      })
      .lean()

    return Object.freeze(docs.map((d) => this.mapWebhookToDto(d as unknown as RawWebhookRecord)))
  }

  async updateWebhookTriggerResult(
    tenantId: string,
    id: string,
    success: boolean,
    triggeredAt: Date = new Date(),
  ): Promise<Readonly<WebhookSubscriptionInternalDto> | null> {
    const updateQuery = success
      ? { $set: { lastTriggeredAt: triggeredAt, failureCount: 0 } }
      : {
          $set: { lastTriggeredAt: triggeredAt },
          $inc: { failureCount: 1 },
        }

    const doc = await this.webhookModel
      .findOneAndUpdate({ _id: id, tenantId }, updateQuery, { new: true })
      .lean()

    if (!doc) return null

    // Se atingiu 5 falhas consecutivas, desativa o webhook
    if (!success && doc.failureCount >= 5 && doc.status === 'ACTIVE') {
      const deactivated = await this.webhookModel
        .findOneAndUpdate({ _id: id, tenantId }, { $set: { status: 'INACTIVE' } }, { new: true })
        .lean()
      return deactivated ? this.mapWebhookToDto(deactivated) : null
    }

    return this.mapWebhookToDto(doc)
  }

  async deleteWebhook(tenantId: string, id: string): Promise<boolean> {
    const result = await this.webhookModel.deleteOne({ _id: id, tenantId })
    return result.deletedCount > 0
  }

  async findTenantConfig(
    tenantId: string,
  ): Promise<Readonly<TenantCustomizationInternalDto> | null> {
    const doc = await this.configModel.findOne({ tenantId }).lean()
    return doc ? this.mapConfigToDto(doc) : null
  }

  async saveTenantConfig(
    dto: Readonly<SaveTenantConfigInternalDto>,
  ): Promise<Readonly<TenantCustomizationInternalDto>> {
    const doc = await this.configModel
      .findOneAndUpdate(
        { tenantId: dto.tenantId },
        {
          $set: {
            displayName: dto.displayName,
            logoUrl: dto.logoUrl,
            primaryColor: dto.primaryColor,
            secondaryColor: dto.secondaryColor,
            enabledModules: [...dto.enabledModules],
            customTerminology: dto.customTerminology,
          },
        },
        { upsert: true, new: true },
      )
      .lean()

    return this.mapConfigToDto(doc)
  }

  private mapWebhookToDto(raw: RawWebhookRecord): Readonly<WebhookSubscriptionInternalDto> {
    return new WebhookSubscriptionInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      name: raw.name,
      targetUrl: raw.targetUrl,
      subscribedEvents: [...raw.subscribedEvents],
      secretToken: raw.secretToken,
      status: raw.status,
      failureCount: raw.failureCount,
      lastTriggeredAt: raw.lastTriggeredAt
        ? raw.lastTriggeredAt instanceof Date
          ? raw.lastTriggeredAt.toISOString()
          : String(raw.lastTriggeredAt)
        : null,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }

  private mapConfigToDto(raw: RawTenantConfigRecord): Readonly<TenantCustomizationInternalDto> {
    return new TenantCustomizationInternalDto({
      tenantId: raw.tenantId,
      displayName: raw.displayName,
      logoUrl: raw.logoUrl ?? null,
      primaryColor: raw.primaryColor,
      secondaryColor: raw.secondaryColor,
      enabledModules: [...raw.enabledModules],
      customTerminology: { ...raw.customTerminology },
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }
}

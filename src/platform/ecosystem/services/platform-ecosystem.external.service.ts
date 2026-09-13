import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { Redis } from 'ioredis'
import { firstValueFrom } from 'rxjs'
import * as crypto from 'crypto'
import { REDIS_PUBLISHER } from '../../redis/redis.tokens.js'
import type { WebhookSubscriptionInternalDto } from '../dtos/internal/webhook-subscription.internal.dto.js'

export interface WebhookDispatchResult {
  readonly success: boolean
  readonly statusCode?: number
  readonly deliveryId: string
  readonly error?: string
}

@Injectable()
export class PlatformEcosystemExternalService {
  private readonly logger = new Logger(PlatformEcosystemExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    private readonly httpService: HttpService,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_PLATFORM_CHANNEL', 'platform_events_stream')
  }

  async sendWebhook(
    webhook: Readonly<WebhookSubscriptionInternalDto>,
    event: string,
    data: unknown,
  ): Promise<WebhookDispatchResult> {
    const deliveryId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const payloadObject = {
      event,
      deliveryId,
      timestamp,
      tenantId: webhook.tenantId,
      data,
    }
    const payload = JSON.stringify(payloadObject)

    const hmac = crypto.createHmac('sha256', webhook.secretToken)
    hmac.update(payload)
    const signature = `sha256=${hmac.digest('hex')}`

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.targetUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Biga-Signature': signature,
            'X-Biga-Event': event,
            'X-Biga-Delivery': deliveryId,
            'X-Biga-Tenant': webhook.tenantId,
            'User-Agent': 'BigaFleetManager-Webhook/1.0',
          },
          timeout: 5000,
        }),
      )

      await this.notifyPlatformAudit({
        event: 'WEBHOOK_DELIVERY_SUCCESS',
        webhookId: webhook.id,
        tenantId: webhook.tenantId,
        eventType: event,
        deliveryId,
        statusCode: response.status,
      })

      return {
        success: true,
        statusCode: response.status,
        deliveryId,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `Failed to deliver webhook ${webhook.id} (${event}) to ${webhook.targetUrl}: ${message}`,
      )

      await this.notifyPlatformAudit({
        event: 'WEBHOOK_DELIVERY_FAILED',
        webhookId: webhook.id,
        tenantId: webhook.tenantId,
        eventType: event,
        deliveryId,
        error: message,
      })

      return {
        success: false,
        deliveryId,
        error: message,
      }
    }
  }

  async notifyPlatformAudit(eventData: Record<string, unknown>): Promise<void> {
    const payload = JSON.stringify({
      ...eventData,
      timestamp: new Date().toISOString(),
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted platform event ${String(eventData.event)} on stream`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast platform event to Redis: ${message}`)
    }
  }
}

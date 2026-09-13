import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../redis/redis.tokens.js'
import type { SupportTicketInternalDto } from '../dtos/internal/support-ticket.internal.dto.js'

@Injectable()
export class PortalExternalService {
  private readonly logger = new Logger(PortalExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_PORTAL_CHANNEL', 'portal_events_stream')
  }

  async notifyTicketOpened(ticket: Readonly<SupportTicketInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'SUPPORT_TICKET_OPENED',
      ticketId: ticket.id,
      tenantId: ticket.tenantId,
      openedByUserId: ticket.openedByUserId,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    })

    await this.publish(payload, `SUPPORT_TICKET_OPENED (${ticket.id})`)
  }

  async notifyTicketUpdated(ticket: Readonly<SupportTicketInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'SUPPORT_TICKET_UPDATED',
      ticketId: ticket.id,
      tenantId: ticket.tenantId,
      status: ticket.status,
      assignedToAgent: ticket.assignedToAgent,
      resolvedAt: ticket.resolvedAt,
      messagesCount: ticket.messages.length,
      updatedAt: ticket.updatedAt,
    })

    await this.publish(payload, `SUPPORT_TICKET_UPDATED (${ticket.id})`)
  }

  async notifyOnboardingStepUpdated(
    tenantId: string,
    stepIndex: number,
    status: string,
  ): Promise<void> {
    const payload = JSON.stringify({
      event: 'ONBOARDING_STEP_UPDATED',
      tenantId,
      stepIndex,
      status,
      timestamp: new Date().toISOString(),
    })

    await this.publish(payload, `ONBOARDING_STEP_UPDATED (${tenantId}, step ${stepIndex})`)
  }

  async notifyLicensesUpdated(tenantId: string, enabledModules: readonly string[]): Promise<void> {
    const payload = JSON.stringify({
      event: 'TENANT_LICENSES_UPDATED',
      tenantId,
      enabledModules: [...enabledModules],
      timestamp: new Date().toISOString(),
    })

    await this.publish(payload, `TENANT_LICENSES_UPDATED (${tenantId})`)
  }

  private async publish(payload: string, description: string): Promise<void> {
    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted portal event on stream: ${description}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast portal event ${description}: ${message}`)
    }
  }
}

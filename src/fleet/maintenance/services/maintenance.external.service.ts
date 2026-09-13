import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import type { MaintenanceOrderInternalDto } from '../dtos/internal/maintenance-order.internal.dto.js'

@Injectable()
export class MaintenanceExternalService {
  private readonly logger = new Logger(MaintenanceExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_MAINTENANCE_CHANNEL', 'maintenance_events_stream')
  }

  async notifyOrderCreated(order: Readonly<MaintenanceOrderInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'MAINTENANCE_ORDER_CREATED',
      orderId: order.id,
      tenantId: order.tenantId,
      vehicleId: order.vehicleId,
      providerId: order.providerId,
      type: order.type,
      scheduledDate: order.scheduledDate,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted MAINTENANCE_ORDER_CREATED for order ${order.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast MAINTENANCE_ORDER_CREATED event: ${message}`)
    }
  }

  async notifyOrderCompleted(order: Readonly<MaintenanceOrderInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'MAINTENANCE_ORDER_COMPLETED',
      orderId: order.id,
      tenantId: order.tenantId,
      vehicleId: order.vehicleId,
      providerId: order.providerId,
      totalCost: order.totalCost,
      totalPartsCost: order.totalPartsCost,
      totalLaborCost: order.totalLaborCost,
      totalDowntimeCost: order.totalDowntimeCost,
      downtimeHours: order.downtimeHours,
      completedAt: order.completedAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted MAINTENANCE_ORDER_COMPLETED for order ${order.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast MAINTENANCE_ORDER_COMPLETED event: ${message}`)
    }
  }
}

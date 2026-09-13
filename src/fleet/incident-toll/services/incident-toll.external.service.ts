import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import type { TollEventInternalDto } from '../dtos/internal/toll-event.internal.dto.js'
import type { IncidentInternalDto } from '../dtos/internal/incident.internal.dto.js'

@Injectable()
export class IncidentTollExternalService {
  private readonly logger = new Logger(IncidentTollExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_TOLL_INCIDENT_CHANNEL', 'toll_incident_events_stream')
  }

  async notifyTollEvent(toll: Readonly<TollEventInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'TOLL_EVENT_REGISTERED',
      tollId: toll.id,
      tenantId: toll.tenantId,
      vehicleId: toll.vehicleId,
      tollPlazaName: toll.tollPlazaName,
      externalTransactionId: toll.externalTransactionId,
      amount: toll.amount,
      passedAt: toll.passedAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(
        `Broadcasted TOLL_EVENT_REGISTERED for transaction ${toll.externalTransactionId}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast TOLL_EVENT_REGISTERED event: ${message}`)
    }
  }

  async notifyIncident(incident: Readonly<IncidentInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'INCIDENT_REGISTERED',
      incidentId: incident.id,
      tenantId: incident.tenantId,
      vehicleId: incident.vehicleId,
      responsibleCompanyId: incident.responsibleCompanyId,
      incidentType: incident.incidentType,
      estimatedCost: incident.estimatedCost,
      occurredAt: incident.occurredAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted INCIDENT_REGISTERED for incident ${incident.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast INCIDENT_REGISTERED event: ${message}`)
    }
  }

  async notifyIncidentSettled(incident: Readonly<IncidentInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'INCIDENT_SETTLED',
      incidentId: incident.id,
      tenantId: incident.tenantId,
      vehicleId: incident.vehicleId,
      responsibleCompanyId: incident.responsibleCompanyId,
      actualCost: incident.actualCost,
      settledAt: incident.settledAt,
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(`Broadcasted INCIDENT_SETTLED for incident ${incident.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast INCIDENT_SETTLED event: ${message}`)
    }
  }
}

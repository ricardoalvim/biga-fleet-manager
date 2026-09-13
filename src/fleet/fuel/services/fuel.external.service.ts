import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_PUBLISHER } from '../../../platform/redis/redis.tokens.js'
import type { FuelAuditInternalDto } from '../dtos/internal/fuel-audit.internal.dto.js'

@Injectable()
export class FuelExternalService {
  private readonly logger = new Logger(FuelExternalService.name)
  private readonly channel: string

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.channel = config.get<string>('REDIS_FUEL_CHANNEL', 'fuel_audit_events_stream')
  }

  async broadcastReconciliation(audit: Readonly<FuelAuditInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'FUEL_TRANSACTION_RECONCILED',
      tenantId: audit.tenantId,
      auditId: audit.id,
      vehicleId: audit.vehicleId,
      plate: audit.plate,
      status: audit.status,
      liters: audit.liters,
      totalValue: audit.totalValue,
      fraudRiskScore: audit.fraudRiskScore,
      fraudSignals: audit.fraudSignals,
      mitigatingFactors: audit.mitigatingFactors,
      timestamp: new Date().toISOString(),
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.log(
        `Broadcasted FUEL_TRANSACTION_RECONCILED for vehicle ${audit.plate} (status: ${audit.status}, score: ${audit.fraudRiskScore})`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast fuel reconciliation event to Redis: ${message}`)
    }
  }

  async broadcastFraudAlert(audit: Readonly<FuelAuditInternalDto>): Promise<void> {
    const payload = JSON.stringify({
      event: 'FUEL_FRAUD_ALERT_TRIGGERED',
      tenantId: audit.tenantId,
      auditId: audit.id,
      vehicleId: audit.vehicleId,
      plate: audit.plate,
      status: audit.status,
      fraudRiskScore: audit.fraudRiskScore,
      fraudSignals: audit.fraudSignals,
      gasStation: audit.gasStation,
      reportedOdometerKm: audit.reportedOdometerKm,
      totalValue: audit.totalValue,
      timestamp: new Date().toISOString(),
    })

    try {
      await this.redis.publish(this.channel, payload)
      this.logger.warn(
        `🚨 FRAUD ALERT broadcasted for vehicle ${audit.plate} (score: ${audit.fraudRiskScore}, signals: ${audit.fraudSignals.join(', ')})`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Failed to broadcast fuel fraud alert to Redis: ${message}`)
    }
  }
}


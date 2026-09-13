import { Inject, Injectable, Logger, Optional, type MessageEvent } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import {
  RealtimeStreamEventEntity,
  type RealtimePositionData,
} from '../entities/realtime-stream-event.entity.js'
import { RealtimeStreamEventInternalDto } from '../dtos/internal/realtime-stream-event.internal.dto.js'
import { PublishRealtimeEventDto } from '../dtos/external/publish-realtime-event.dto.js'

export const REALTIME_STREAMING_CONFIG = 'REALTIME_STREAMING_CONFIG'

export interface RealtimeStreamingConfig {
  readonly positionThrottleMs: number
}

const DEFAULT_CONFIG: RealtimeStreamingConfig = {
  positionThrottleMs: 3000,
}

@Injectable()
export class RealtimeStreamingInternalService {
  private readonly logger = new Logger(RealtimeStreamingInternalService.name)
  private readonly streamSubject = new Subject<RealtimeStreamEventInternalDto>()
  private readonly lastEmittedTimestamps = new Map<string, number>()
  private readonly lastIgnitionState = new Map<string, boolean>()
  private readonly config: RealtimeStreamingConfig

  constructor(
    private readonly tenantContext: TenantContext,
    @Optional() @Inject(REALTIME_STREAMING_CONFIG) config?: RealtimeStreamingConfig,
  ) {
    this.config = config ?? DEFAULT_CONFIG
  }

  /**
   * Retorna um Observable com os eventos SSE filtrados exclusivamente para o tenant solicitado.
   */
  getTenantStream(tenantId?: string): Observable<MessageEvent> {
    let targetTenantId = tenantId
    if (!targetTenantId) {
      try {
        targetTenantId = this.tenantContext.tenantId
      } catch {
        targetTenantId = undefined
      }
    }

    return this.streamSubject.asObservable().pipe(
      filter((evt) => !targetTenantId || evt.tenantId === targetTenantId),
      map((evt): MessageEvent => ({
        type: evt.event,
        id: evt.id,
        data: {
          event: evt.event,
          tenantId: evt.tenantId,
          vehicleId: evt.vehicleId,
          data: evt.data,
          timestamp: evt.timestamp,
        },
      })),
    )
  }

  /**
   * Injeta um evento de streaming no barramento aplicando regras de throttle por ativo.
   * Retorna true se o evento foi emitido ou false se foi descartado por throttle.
   */
  publishEvent(dto: PublishRealtimeEventDto, tenantId?: string): boolean {
    let finalTenantId = dto.tenantId ?? tenantId
    if (!finalTenantId) {
      try {
        finalTenantId = this.tenantContext.tenantId
      } catch {
        finalTenantId = '00000000-0000-4000-8000-000000000001'
      }
    }
    const entity = new RealtimeStreamEventEntity({
      id: crypto.randomUUID(),
      event: dto.event,
      tenantId: finalTenantId,
      vehicleId: dto.vehicleId,
      data: dto.data as unknown as RealtimePositionData,
    })

    // Avalia throttling para atualizações frequentes de posição
    if (entity.event === 'vehicle.position.updated') {
      const posData = entity.data as RealtimePositionData
      const key = `${finalTenantId}:${entity.vehicleId}`
      const now = Date.now()
      const lastEmitted = this.lastEmittedTimestamps.get(key) ?? 0
      const previousIgnition = this.lastIgnitionState.get(key)

      const isIgnitionChanged =
        previousIgnition !== undefined && previousIgnition !== posData.ignition

      // Se mudou de ignição, não aplica throttle para permitir alerta instantâneo
      if (!isIgnitionChanged && now - lastEmitted < this.config.positionThrottleMs) {
        this.logger.debug(
          `Posição throttled para veículo ${entity.vehicleId} (intervalo < ${this.config.positionThrottleMs}ms)`,
        )
        return false
      }

      this.lastEmittedTimestamps.set(key, now)
      this.lastIgnitionState.set(key, posData.ignition)
    }

    const internalDto = new RealtimeStreamEventInternalDto({
      id: entity.id,
      event: entity.event,
      tenantId: entity.tenantId,
      vehicleId: entity.vehicleId,
      data: entity.data,
      timestamp: entity.timestamp.toISOString(),
    })

    this.streamSubject.next(internalDto)
    return true
  }

  clearThrottleCache(): void {
    this.lastEmittedTimestamps.clear()
    this.lastIgnitionState.clear()
  }
}

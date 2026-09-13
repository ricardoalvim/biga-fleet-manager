import type {
  RealtimeEventType,
  RealtimeEventPayload,
} from '../../entities/realtime-stream-event.entity.js'

export interface RealtimeStreamEventInternalProps {
  readonly id: string
  readonly event: RealtimeEventType
  readonly tenantId: string
  readonly vehicleId: string
  readonly data: RealtimeEventPayload
  readonly timestamp: string
}

export class RealtimeStreamEventInternalDto {
  readonly id: string
  readonly event: RealtimeEventType
  readonly tenantId: string
  readonly vehicleId: string
  readonly data: RealtimeEventPayload
  readonly timestamp: string

  constructor(props: RealtimeStreamEventInternalProps) {
    this.id = props.id
    this.event = props.event
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.data = Object.freeze({ ...props.data })
    this.timestamp = props.timestamp
    Object.freeze(this)
  }
}

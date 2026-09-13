import type { WebhookStatus } from '../../entities/webhook-subscription.entity.js'

export interface CreateWebhookInternalProps {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly targetUrl: string
  readonly subscribedEvents: readonly string[]
  readonly secretToken: string
  readonly status: WebhookStatus
  readonly failureCount: number
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class CreateWebhookInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly targetUrl: string
  readonly subscribedEvents: readonly string[]
  readonly secretToken: string
  readonly status: WebhookStatus
  readonly failureCount: number
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: CreateWebhookInternalProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name
    this.targetUrl = props.targetUrl
    this.subscribedEvents = Object.freeze([...props.subscribedEvents])
    this.secretToken = props.secretToken
    this.status = props.status
    this.failureCount = props.failureCount
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}

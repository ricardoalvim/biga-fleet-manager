import * as crypto from 'crypto'

export type WebhookStatus = 'ACTIVE' | 'INACTIVE'

export interface WebhookSubscriptionProps {
  id: string
  tenantId: string
  name: string
  targetUrl: string
  subscribedEvents: string[]
  secretToken: string
  status?: WebhookStatus
  failureCount?: number
  lastTriggeredAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class WebhookSubscriptionEntity {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly targetUrl: string
  readonly subscribedEvents: readonly string[]
  readonly secretToken: string
  readonly status: WebhookStatus
  readonly failureCount: number
  readonly lastTriggeredAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: WebhookSubscriptionProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID do webhook é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do webhook é obrigatório')
    }
    if (!props.targetUrl || !WebhookSubscriptionEntity.isValidUrl(props.targetUrl)) {
      throw new Error('URL de destino inválida (deve começar com http:// ou https://)')
    }
    if (!props.secretToken || props.secretToken.length < 16) {
      throw new Error('O segredo do webhook (secretToken) deve ter pelo menos 16 caracteres')
    }
    if (!props.subscribedEvents || props.subscribedEvents.length === 0) {
      throw new Error('Pelo menos um evento de subscrição deve ser informado')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.name = props.name.trim()
    this.targetUrl = props.targetUrl.trim()
    this.subscribedEvents = Object.freeze([...props.subscribedEvents])
    this.secretToken = props.secretToken
    this.status = props.status ?? 'ACTIVE'
    this.failureCount = props.failureCount ?? 0
    this.lastTriggeredAt = props.lastTriggeredAt ?? null
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  calculateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.secretToken)
    hmac.update(payload)
    return `sha256=${hmac.digest('hex')}`
  }

  matchesEvent(event: string): boolean {
    if (this.status !== 'ACTIVE') return false
    return this.subscribedEvents.includes('*') || this.subscribedEvents.includes(event)
  }

  recordSuccess(triggeredAt: Date = new Date()): WebhookSubscriptionEntity {
    return new WebhookSubscriptionEntity({
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      targetUrl: this.targetUrl,
      subscribedEvents: [...this.subscribedEvents],
      secretToken: this.secretToken,
      status: 'ACTIVE',
      failureCount: 0,
      lastTriggeredAt: triggeredAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  recordFailure(triggeredAt: Date = new Date()): WebhookSubscriptionEntity {
    const newFailureCount = this.failureCount + 1
    const newStatus: WebhookStatus = newFailureCount >= 5 ? 'INACTIVE' : this.status

    return new WebhookSubscriptionEntity({
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      targetUrl: this.targetUrl,
      subscribedEvents: [...this.subscribedEvents],
      secretToken: this.secretToken,
      status: newStatus,
      failureCount: newFailureCount,
      lastTriggeredAt: triggeredAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}

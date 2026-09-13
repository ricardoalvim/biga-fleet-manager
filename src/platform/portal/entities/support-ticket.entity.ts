export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'INTEGRATION' | 'FEATURE_REQUEST' | 'OTHER'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'RESOLVED' | 'CLOSED'

export interface TicketMessage {
  readonly messageId: string
  readonly authorId: string
  readonly authorName: string
  readonly text: string
  readonly isStaff: boolean
  readonly sentAt: Date
}

export interface SupportTicketProps {
  id: string
  tenantId: string
  openedByUserId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status?: TicketStatus
  messages?: TicketMessage[]
  assignedToAgent?: string | null
  resolvedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class SupportTicketEntity {
  readonly id: string
  readonly tenantId: string
  readonly openedByUserId: string
  readonly title: string
  readonly description: string
  readonly category: TicketCategory
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly messages: readonly TicketMessage[]
  readonly assignedToAgent: string | null
  readonly resolvedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: SupportTicketProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID do chamado é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Título do chamado é obrigatório')
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Descrição do chamado é obrigatória')
    }

    const initialMessages = props.messages ?? [
      {
        messageId: crypto.randomUUID(),
        authorId: props.openedByUserId,
        authorName: 'Usuário do Tenant',
        text: props.description.trim(),
        isStaff: false,
        sentAt: props.createdAt ?? new Date(),
      },
    ]

    this.id = props.id
    this.tenantId = props.tenantId
    this.openedByUserId = props.openedByUserId
    this.title = props.title.trim()
    this.description = props.description.trim()
    this.category = props.category
    this.priority = props.priority
    this.status = props.status ?? 'OPEN'
    this.messages = Object.freeze(initialMessages.map((m) => Object.freeze({ ...m })))
    this.assignedToAgent = props.assignedToAgent ?? null
    this.resolvedAt = props.resolvedAt ?? null
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }

  addMessage(
    authorId: string,
    authorName: string,
    text: string,
    isStaff: boolean,
  ): SupportTicketEntity {
    if (!text || text.trim().length === 0) {
      throw new Error('Mensagem não pode estar vazia')
    }

    const newMessage: TicketMessage = {
      messageId: crypto.randomUUID(),
      authorId,
      authorName: authorName.trim(),
      text: text.trim(),
      isStaff,
      sentAt: new Date(),
    }

    const nextStatus = isStaff ? 'WAITING_CLIENT' : 'IN_PROGRESS'

    return new SupportTicketEntity({
      id: this.id,
      tenantId: this.tenantId,
      openedByUserId: this.openedByUserId,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status === 'CLOSED' ? 'OPEN' : nextStatus,
      messages: [...this.messages, newMessage],
      assignedToAgent: this.assignedToAgent,
      resolvedAt: this.resolvedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  resolve(): SupportTicketEntity {
    return new SupportTicketEntity({
      id: this.id,
      tenantId: this.tenantId,
      openedByUserId: this.openedByUserId,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: 'RESOLVED',
      messages: [...this.messages],
      assignedToAgent: this.assignedToAgent,
      resolvedAt: new Date(),
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  close(): SupportTicketEntity {
    return new SupportTicketEntity({
      id: this.id,
      tenantId: this.tenantId,
      openedByUserId: this.openedByUserId,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: 'CLOSED',
      messages: [...this.messages],
      assignedToAgent: this.assignedToAgent,
      resolvedAt: this.resolvedAt ?? new Date(),
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}

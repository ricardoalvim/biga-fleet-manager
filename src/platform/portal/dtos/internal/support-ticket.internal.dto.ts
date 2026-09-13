import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../entities/support-ticket.entity.js'

export interface TicketMessageInternalDtoProps {
  readonly messageId: string
  readonly authorId: string
  readonly authorName: string
  readonly text: string
  readonly isStaff: boolean
  readonly sentAt: string
}

export class TicketMessageInternalDto {
  readonly messageId: string
  readonly authorId: string
  readonly authorName: string
  readonly text: string
  readonly isStaff: boolean
  readonly sentAt: string

  constructor(props: TicketMessageInternalDtoProps) {
    this.messageId = props.messageId
    this.authorId = props.authorId
    this.authorName = props.authorName
    this.text = props.text
    this.isStaff = props.isStaff
    this.sentAt = props.sentAt

    Object.freeze(this)
  }
}

export interface SupportTicketInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly openedByUserId: string
  readonly title: string
  readonly description: string
  readonly category: TicketCategory
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly messages: readonly TicketMessageInternalDto[]
  readonly assignedToAgent?: string | null
  readonly resolvedAt?: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export class SupportTicketInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly openedByUserId: string
  readonly title: string
  readonly description: string
  readonly category: TicketCategory
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly messages: readonly TicketMessageInternalDto[]
  readonly assignedToAgent: string | null
  readonly resolvedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string

  constructor(props: SupportTicketInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.openedByUserId = props.openedByUserId
    this.title = props.title
    this.description = props.description
    this.category = props.category
    this.priority = props.priority
    this.status = props.status
    this.messages = Object.freeze([...props.messages])
    this.assignedToAgent = props.assignedToAgent ?? null
    this.resolvedAt = props.resolvedAt ?? null
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}

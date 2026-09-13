import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../entities/support-ticket.entity.js'

@Schema({ _id: false })
export class TicketMessageSubdocument {
  @Prop({ required: true, type: String })
  messageId!: string

  @Prop({ required: true, type: String })
  authorId!: string

  @Prop({ required: true, type: String })
  authorName!: string

  @Prop({ required: true, type: String })
  text!: string

  @Prop({ required: true, type: Boolean, default: false })
  isStaff!: boolean

  @Prop({ required: true, type: Date })
  sentAt!: Date
}
export const TicketMessageSubdocumentSchema: MongooseSchema =
  SchemaFactory.createForClass(TicketMessageSubdocument)

@Schema({ timestamps: true, collection: 'portal_support_tickets' })
export class PortalTicketDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  openedByUserId!: string

  @Prop({ required: true, type: String })
  title!: string

  @Prop({ required: true, type: String })
  description!: string

  @Prop({
    required: true,
    type: String,
    enum: ['TECHNICAL', 'BILLING', 'INTEGRATION', 'FEATURE_REQUEST', 'OTHER'],
    index: true,
  })
  category!: TicketCategory

  @Prop({
    required: true,
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  })
  priority!: TicketPriority

  @Prop({
    required: true,
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  })
  status!: TicketStatus

  @Prop({ required: true, type: [TicketMessageSubdocumentSchema], default: [] })
  messages!: TicketMessageSubdocument[]

  @Prop({ type: String, default: null })
  assignedToAgent?: string | null

  @Prop({ type: Date, default: null })
  resolvedAt?: Date | null

  createdAt!: Date
  updatedAt!: Date
}

export const PortalTicketSchema: MongooseSchema = SchemaFactory.createForClass(PortalTicketDocument)

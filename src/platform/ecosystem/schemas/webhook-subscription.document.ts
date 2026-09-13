import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'
import type { WebhookStatus } from '../entities/webhook-subscription.entity.js'

@Schema({ timestamps: true, collection: 'platform_webhooks' })
export class WebhookSubscriptionDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  name!: string

  @Prop({ required: true, type: String })
  targetUrl!: string

  @Prop({ required: true, type: [String] })
  subscribedEvents!: string[]

  @Prop({ required: true, type: String })
  secretToken!: string

  @Prop({
    required: true,
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    index: true,
  })
  status!: WebhookStatus

  @Prop({ required: true, type: Number, default: 0 })
  failureCount!: number

  @Prop({ type: Date, default: null })
  lastTriggeredAt?: Date | null

  createdAt!: Date
  updatedAt!: Date
}

export const WebhookSubscriptionSchema: MongooseSchema = SchemaFactory.createForClass(
  WebhookSubscriptionDocument,
)

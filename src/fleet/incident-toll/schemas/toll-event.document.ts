import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true, collection: 'toll_events' })
export class TollEventDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  vehicleId!: string

  @Prop({ required: true, type: String })
  tollPlazaName!: string

  @Prop({ required: true, type: String, index: true })
  externalTransactionId!: string

  @Prop({ required: true, type: Number })
  amount!: number

  @Prop({ required: true, type: Date })
  passedAt!: Date

  createdAt!: Date
  updatedAt!: Date
}

export const TollEventSchema = SchemaFactory.createForClass(TollEventDocument)

// Compound unique index enforcing transaction idempotency per tenant
TollEventSchema.index({ tenantId: 1, externalTransactionId: 1 }, { unique: true })

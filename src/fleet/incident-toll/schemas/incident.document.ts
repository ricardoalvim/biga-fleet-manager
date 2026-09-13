import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true, collection: 'incidents' })
export class IncidentDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  vehicleId!: string

  @Prop({ required: true, type: String, index: true })
  responsibleCompanyId!: string

  @Prop({
    required: true,
    type: String,
    enum: ['ACCIDENT', 'FINE', 'DAMAGE', 'THEFT', 'OTHER'],
    index: true,
  })
  incidentType!: 'ACCIDENT' | 'FINE' | 'DAMAGE' | 'THEFT' | 'OTHER'

  @Prop({ required: true, type: String })
  description!: string

  @Prop({ required: true, type: Number, default: 0 })
  estimatedCost!: number

  @Prop({ type: Number, default: null })
  actualCost?: number | null

  @Prop({
    required: true,
    type: String,
    enum: ['OPEN', 'IN_REVIEW', 'SETTLED', 'CANCELLED'],
    default: 'OPEN',
    index: true,
  })
  status!: 'OPEN' | 'IN_REVIEW' | 'SETTLED' | 'CANCELLED'

  @Prop({ required: true, type: Date })
  occurredAt!: Date

  @Prop({ type: Date, default: null })
  settledAt?: Date | null

  createdAt!: Date
  updatedAt!: Date
}

export const IncidentSchema = SchemaFactory.createForClass(IncidentDocument)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ _id: false })
export class MaintenanceOrderItemSubdocument {
  @Prop({ required: true, type: String })
  description!: string

  @Prop({ required: true, type: String, enum: ['INSPECTION', 'REPLACEMENT'] })
  action!: 'INSPECTION' | 'REPLACEMENT'

  @Prop({ required: true, type: Number, default: 0 })
  partCost!: number

  @Prop({ required: true, type: Number, default: 0 })
  laborCost!: number
}

export const MaintenanceOrderItemSubdocumentSchema = SchemaFactory.createForClass(
  MaintenanceOrderItemSubdocument,
)

@Schema({ timestamps: true, collection: 'maintenance_orders' })
export class MaintenanceOrderDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  vehicleId!: string

  @Prop({ required: true, type: String, index: true })
  providerId!: string

  @Prop({ required: true, type: String, enum: ['PREVENTIVE', 'CORRECTIVE'], default: 'CORRECTIVE' })
  type!: 'PREVENTIVE' | 'CORRECTIVE'

  @Prop({
    required: true,
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN',
    index: true,
  })
  status!: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

  @Prop({ required: true, type: Date })
  scheduledDate!: Date

  @Prop({ type: Date, default: null })
  completedAt?: Date | null

  @Prop({ type: Number, default: 0 })
  downtimeHours!: number

  @Prop({ type: Number, default: 0 })
  downtimeCostPerHour!: number

  @Prop({ type: Number, default: 0 })
  totalPartsCost!: number

  @Prop({ type: Number, default: 0 })
  totalLaborCost!: number

  @Prop({ type: Number, default: 0 })
  totalDowntimeCost!: number

  @Prop({ type: Number, default: 0 })
  totalCost!: number

  @Prop({ type: [MaintenanceOrderItemSubdocumentSchema], default: [] })
  executedItems!: MaintenanceOrderItemSubdocument[]

  createdAt!: Date
  updatedAt!: Date
}

export const MaintenanceOrderSchema = SchemaFactory.createForClass(MaintenanceOrderDocument)

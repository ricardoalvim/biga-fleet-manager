import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ _id: false })
export class MaintenancePlanItemSubdocument {
  @Prop({ required: true, type: String })
  description!: string

  @Prop({ required: true, type: String, enum: ['INSPECTION', 'REPLACEMENT'] })
  action!: 'INSPECTION' | 'REPLACEMENT'
}

export const MaintenancePlanItemSubdocumentSchema = SchemaFactory.createForClass(
  MaintenancePlanItemSubdocument,
)

@Schema({ timestamps: true, collection: 'maintenance_plans' })
export class MaintenancePlanDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String })
  name!: string

  @Prop({ required: true, type: Number })
  triggerKm!: number

  @Prop({ type: [MaintenancePlanItemSubdocumentSchema], default: [] })
  items!: MaintenancePlanItemSubdocument[]

  createdAt!: Date
  updatedAt!: Date
}

export const MaintenancePlanSchema = SchemaFactory.createForClass(MaintenancePlanDocument)

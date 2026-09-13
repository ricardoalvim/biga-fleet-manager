import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'

@Schema({ timestamps: true, collection: 'tenant_customizations' })
export class TenantCustomizationDocument extends Document {
  @Prop({ required: true, type: String, unique: true, index: true })
  tenantId!: string

  @Prop({ required: true, type: String })
  displayName!: string

  @Prop({ type: String, default: null })
  logoUrl?: string | null

  @Prop({ required: true, type: String, default: '#1E3A8A' })
  primaryColor!: string

  @Prop({ required: true, type: String, default: '#3B82F6' })
  secondaryColor!: string

  @Prop({ required: true, type: [String], default: [] })
  enabledModules!: string[]

  @Prop({ type: Object, default: {} })
  customTerminology!: Record<string, string>

  createdAt!: Date
  updatedAt!: Date
}

export const TenantCustomizationSchema: MongooseSchema = SchemaFactory.createForClass(
  TenantCustomizationDocument,
)

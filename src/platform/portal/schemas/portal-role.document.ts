import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'

@Schema({ timestamps: true, collection: 'portal_roles' })
export class PortalRoleDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String })
  name!: string

  @Prop({ type: String, default: '' })
  description!: string

  @Prop({ required: true, type: [String] })
  permissions!: string[]

  @Prop({ required: true, type: Boolean, default: false })
  isSystemDefault!: boolean

  createdAt!: Date
  updatedAt!: Date
}

export const PortalRoleSchema: MongooseSchema = SchemaFactory.createForClass(PortalRoleDocument)

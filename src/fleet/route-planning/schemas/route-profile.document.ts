import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'
import type { BusinessContext } from '../entities/route-profile.entity.js'

@Schema({ _id: false })
export class CustomTerminologyDocument {
  @Prop({ required: true, type: String })
  stopPointLabel!: string

  @Prop({ required: true, type: String })
  assetLabel!: string

  @Prop({ required: true, type: String })
  routeLabel!: string
}
export const CustomTerminologySchema: MongooseSchema =
  SchemaFactory.createForClass(CustomTerminologyDocument)

@Schema({ _id: false })
export class PhysicalConstraintsDocument {
  @Prop({ required: true, type: Number })
  maxWeightTons!: number

  @Prop({ required: true, type: Number })
  maxHeightMeters!: number

  @Prop({ required: true, type: Boolean, default: false })
  allowUnpavedRoads!: boolean

  @Prop({ required: true, type: Number })
  maxSpeedKmh!: number
}
export const PhysicalConstraintsSchema: MongooseSchema = SchemaFactory.createForClass(
  PhysicalConstraintsDocument,
)

@Schema({ timestamps: true, collection: 'route_profiles' })
export class RouteProfileDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  name!: string

  @Prop({
    required: true,
    type: String,
    enum: ['DELIVERY', 'PASSENGER', 'HEAVY_CARGO', 'AGRICULTURAL'],
    index: true,
  })
  businessContext!: BusinessContext

  @Prop({ required: true, type: CustomTerminologySchema })
  customTerminology!: CustomTerminologyDocument

  @Prop({ required: true, type: PhysicalConstraintsSchema })
  physicalConstraints!: PhysicalConstraintsDocument

  createdAt!: Date
  updatedAt!: Date
}

export const RouteProfileSchema: MongooseSchema = SchemaFactory.createForClass(RouteProfileDocument)

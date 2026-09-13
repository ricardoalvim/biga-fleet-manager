import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true, collection: 'telemetry' })
export class Telemetry extends Document {
  @Prop({ required: true, index: true })
  tenantId!: string

  @Prop({ required: true, index: true })
  deviceId!: string

  @Prop({ required: true })
  vehicleId!: string

  @Prop({ required: true, index: true })
  tripId!: string

  @Prop({ required: true })
  latitude!: number

  @Prop({ required: true })
  longitude!: number

  @Prop({ required: true })
  speed!: number

  @Prop({ required: true })
  timestamp!: Date
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry)

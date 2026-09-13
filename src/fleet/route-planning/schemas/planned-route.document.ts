import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'
import type { PlannedRouteStatus } from '../entities/planned-route.entity.js'

@Schema({ _id: false })
export class GeoPointDocument {
  @Prop({ required: true, type: Number })
  latitude!: number

  @Prop({ required: true, type: Number })
  longitude!: number

  @Prop({ type: String, default: null })
  address?: string | null
}
export const GeoPointSchema: MongooseSchema = SchemaFactory.createForClass(GeoPointDocument)

@Schema({ _id: false })
export class WaypointDocument {
  @Prop({ required: true, type: Number })
  latitude!: number

  @Prop({ required: true, type: Number })
  longitude!: number

  @Prop({ required: true, type: Number })
  sequence!: number

  @Prop({ type: String, default: null })
  address?: string | null
}
export const WaypointSchema: MongooseSchema = SchemaFactory.createForClass(WaypointDocument)

@Schema({ timestamps: true, collection: 'planned_routes' })
export class PlannedRouteDocument extends Document {
  @Prop({ required: true, type: String, index: true })
  tenantId!: string

  @Prop({ required: true, type: String, index: true })
  profileId!: string

  @Prop({ required: true, type: String, index: true })
  vehicleId!: string

  @Prop({ required: true, type: GeoPointSchema })
  origin!: GeoPointDocument

  @Prop({ required: true, type: GeoPointSchema })
  destination!: GeoPointDocument

  @Prop({ required: true, type: [WaypointSchema], default: [] })
  waypoints!: WaypointDocument[]

  @Prop({ required: true, type: Number, default: 0 })
  distanceKm!: number

  @Prop({ required: true, type: Number, default: 0 })
  estimatedDurationMinutes!: number

  @Prop({ required: true, type: Number, default: 0 })
  projectedFuelLiters!: number

  @Prop({
    required: true,
    type: String,
    enum: ['PLANNED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED',
    index: true,
  })
  status!: PlannedRouteStatus

  @Prop({ type: Date, default: null })
  dispatchedAt?: Date | null

  createdAt!: Date
  updatedAt!: Date
}

export const PlannedRouteSchema: MongooseSchema = SchemaFactory.createForClass(PlannedRouteDocument)

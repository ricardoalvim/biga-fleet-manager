import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type FuelAuditRecordDocument = FuelAuditRecordModel & Document

export type FuelStatus = 'APPROVED' | 'SUSPECT' | 'REJECTED'

export type FuelType =
  | 'DIESEL_S10'
  | 'DIESEL_S500'
  | 'GASOLINE'
  | 'ETHANOL'
  | 'CNG'
  | 'ARLA32'

@Schema({ _id: false })
export class GasStationSubdocument {
  @Prop({ required: true })
  name!: string

  @Prop({ required: false })
  cnpj?: string

  @Prop({ required: true, type: Number })
  latitude!: number

  @Prop({ required: true, type: Number })
  longitude!: number

  @Prop({ required: false })
  address?: string
}

@Schema({ collection: 'fuel_audit_records', timestamps: true })
export class FuelAuditRecordModel {
  @Prop({ required: true, index: true })
  tenantId!: string

  @Prop({ required: true, index: true })
  vehicleId!: string

  @Prop({ required: false, index: true })
  driverId?: string

  @Prop({ required: true, index: true })
  plate!: string

  @Prop({ required: true, type: GasStationSubdocument })
  gasStation!: GasStationSubdocument

  @Prop({ required: true, type: Date, index: true })
  timestamp!: Date

  @Prop({ required: true, enum: ['DIESEL_S10', 'DIESEL_S500', 'GASOLINE', 'ETHANOL', 'CNG', 'ARLA32'] })
  fuelType!: FuelType

  @Prop({ required: true, type: Number })
  liters!: number

  @Prop({ required: true, type: Number })
  pricePerLiter!: number

  @Prop({ required: true, type: Number })
  totalValue!: number

  @Prop({ required: true, type: Number })
  reportedOdometerKm!: number

  @Prop({ required: true, enum: ['APPROVED', 'SUSPECT', 'REJECTED'], default: 'APPROVED', index: true })
  status!: FuelStatus

  @Prop({ required: true, type: Number, default: 0 })
  fraudRiskScore!: number

  @Prop({ required: true, type: [String], default: [] })
  fraudSignals!: string[]

  @Prop({ required: true, type: [String], default: [] })
  mitigatingFactors!: string[]

  @Prop({ required: true, type: Date, default: Date.now })
  reconciledAt!: Date

  @Prop({ required: false })
  notes?: string
}

export const FuelAuditRecordSchema = SchemaFactory.createForClass(FuelAuditRecordModel)

FuelAuditRecordSchema.index({ tenantId: 1, vehicleId: 1, timestamp: -1 })
FuelAuditRecordSchema.index({ tenantId: 1, status: 1 })


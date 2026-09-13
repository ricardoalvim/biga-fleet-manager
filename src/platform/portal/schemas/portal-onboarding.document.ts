import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, type Schema as MongooseSchema } from 'mongoose'
import type { StepStatus } from '../entities/onboarding-journey.entity.js'

@Schema({ _id: false })
export class OnboardingStepSubdocument {
  @Prop({ required: true, type: Number })
  stepIndex!: number

  @Prop({ required: true, type: String })
  code!: string

  @Prop({ required: true, type: String })
  title!: string

  @Prop({
    required: true,
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
    default: 'PENDING',
  })
  status!: StepStatus

  @Prop({ type: Date, default: null })
  completedAt?: Date | null

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>
}
export const OnboardingStepSubdocumentSchema: MongooseSchema =
  SchemaFactory.createForClass(OnboardingStepSubdocument)

@Schema({ timestamps: true, collection: 'portal_onboardings' })
export class PortalOnboardingDocument extends Document {
  @Prop({ required: true, type: String, unique: true, index: true })
  tenantId!: string

  @Prop({ required: true, type: Number, default: 1 })
  currentStepIndex!: number

  @Prop({ required: true, type: [OnboardingStepSubdocumentSchema] })
  steps!: OnboardingStepSubdocument[]

  @Prop({ required: true, type: Boolean, default: false })
  isCompleted!: boolean

  createdAt!: Date
  updatedAt!: Date
}

export const PortalOnboardingSchema: MongooseSchema =
  SchemaFactory.createForClass(PortalOnboardingDocument)

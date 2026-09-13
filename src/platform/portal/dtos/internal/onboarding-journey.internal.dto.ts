import type { StepStatus } from '../../entities/onboarding-journey.entity.js'

export interface OnboardingStepInternalDtoProps {
  readonly stepIndex: number
  readonly code: string
  readonly title: string
  readonly status: StepStatus
  readonly completedAt?: string | null
  readonly metadata?: Record<string, unknown>
}

export class OnboardingStepInternalDto {
  readonly stepIndex: number
  readonly code: string
  readonly title: string
  readonly status: StepStatus
  readonly completedAt: string | null
  readonly metadata: Record<string, unknown>

  constructor(props: OnboardingStepInternalDtoProps) {
    this.stepIndex = props.stepIndex
    this.code = props.code
    this.title = props.title
    this.status = props.status
    this.completedAt = props.completedAt ?? null
    this.metadata = Object.freeze({ ...(props.metadata ?? {}) })

    Object.freeze(this)
  }
}

export interface OnboardingJourneyInternalDtoProps {
  readonly id: string
  readonly tenantId: string
  readonly currentStepIndex: number
  readonly progressPercentage: number
  readonly steps: readonly OnboardingStepInternalDto[]
  readonly isCompleted: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export class OnboardingJourneyInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly currentStepIndex: number
  readonly progressPercentage: number
  readonly steps: readonly OnboardingStepInternalDto[]
  readonly isCompleted: boolean
  readonly createdAt: string
  readonly updatedAt: string

  constructor(props: OnboardingJourneyInternalDtoProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.currentStepIndex = props.currentStepIndex
    this.progressPercentage = props.progressPercentage
    this.steps = Object.freeze([...props.steps])
    this.isCompleted = props.isCompleted
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }
}

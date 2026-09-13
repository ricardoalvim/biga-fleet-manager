export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

export interface OnboardingStep {
  readonly stepIndex: number
  readonly code: string
  readonly title: string
  readonly status: StepStatus
  readonly completedAt?: Date | null
  readonly metadata?: Record<string, unknown>
}

export const DEFAULT_ONBOARDING_STEPS: ReadonlyArray<
  Omit<OnboardingStep, 'status' | 'completedAt'>
> = [
  {
    stepIndex: 1,
    code: 'TENANT_WHITE_LABEL',
    title: 'Configuração de Tenant e Identidade Visual (White-Label)',
  },
  {
    stepIndex: 2,
    code: 'FLEET_REGISTRATION',
    title: 'Cadastro da Frota e Vínculos Tripartites',
  },
  {
    stepIndex: 3,
    code: 'TELEMETRY_HOMOLOGATION',
    title: 'Instalação e Homologação da Telemetria IoT',
  },
  {
    stepIndex: 4,
    code: 'DRIVERS_AND_ALERTS',
    title: 'Atribuição de Motoristas e Regras de Alerta',
  },
  {
    stepIndex: 5,
    code: 'COMPLETION_DASHBOARD',
    title: 'Conclusão e Liberação do Dashboard Operacional',
  },
]

export interface OnboardingJourneyProps {
  id: string
  tenantId: string
  currentStepIndex?: number
  steps?: OnboardingStep[]
  isCompleted?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export class OnboardingJourneyEntity {
  readonly id: string
  readonly tenantId: string
  readonly currentStepIndex: number
  readonly steps: readonly OnboardingStep[]
  readonly isCompleted: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: OnboardingJourneyProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('ID da jornada de onboarding é obrigatório')
    }
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new Error('Tenant ID é obrigatório')
    }

    const defaultSteps: readonly OnboardingStep[] = DEFAULT_ONBOARDING_STEPS.map(
      (s): OnboardingStep => ({
        stepIndex: s.stepIndex,
        code: s.code,
        title: s.title,
        status: s.stepIndex === 1 ? 'IN_PROGRESS' : 'PENDING',
        completedAt: null,
        metadata: {},
      }),
    )

    const steps: readonly OnboardingStep[] =
      props.steps && props.steps.length === 5 ? props.steps : defaultSteps

    const completedStepsCount = steps.filter((s) => s.status === 'COMPLETED').length
    const isCompleted = props.isCompleted ?? completedStepsCount === 5

    this.id = props.id
    this.tenantId = props.tenantId
    this.currentStepIndex =
      props.currentStepIndex ?? (isCompleted ? 5 : Math.min(5, completedStepsCount + 1))
    this.steps = Object.freeze(
      steps.map((s): OnboardingStep =>
        Object.freeze({
          stepIndex: s.stepIndex,
          code: s.code,
          title: s.title,
          status: s.status,
          completedAt: s.completedAt,
          metadata: s.metadata,
        }),
      ),
    )
    this.isCompleted = isCompleted
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()

    Object.freeze(this)
  }

  getProgressPercentage(): number {
    const completedCount = this.steps.filter((s) => s.status === 'COMPLETED').length
    return Math.round((completedCount / this.steps.length) * 100)
  }

  updateStep(
    stepIndex: number,
    status: StepStatus,
    metadata?: Record<string, unknown>,
  ): OnboardingJourneyEntity {
    if (stepIndex < 1 || stepIndex > 5) {
      throw new Error(`Índice de etapa inválido: ${stepIndex}. Deve estar entre 1 e 5.`)
    }

    const updatedSteps = this.steps.map((s) => {
      if (s.stepIndex === stepIndex) {
        return {
          ...s,
          status,
          completedAt: status === 'COMPLETED' ? new Date() : s.completedAt,
          metadata: metadata ? { ...(s.metadata ?? {}), ...metadata } : s.metadata,
        }
      }
      return s
    })

    const completedCount = updatedSteps.filter((s) => s.status === 'COMPLETED').length
    const nextCurrent =
      completedCount === 5 ? 5 : Math.min(5, stepIndex + (status === 'COMPLETED' ? 1 : 0))

    return new OnboardingJourneyEntity({
      id: this.id,
      tenantId: this.tenantId,
      currentStepIndex: nextCurrent,
      steps: updatedSteps,
      isCompleted: completedCount === 5,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}

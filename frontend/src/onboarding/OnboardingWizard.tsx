import React, { useState } from 'react'
import type { OnboardingJourney, OnboardingStep, StepStatus } from '../types/portal.types.js'
import { useI18n } from '../i18n/index.js'

interface OnboardingWizardProps {
  readonly journey: OnboardingJourney
  readonly onUpdateStep: (
    stepIndex: number,
    status: StepStatus,
    metadata?: Record<string, unknown>,
  ) => Promise<void>
  readonly onCompleteJourney?: () => void
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  journey,
  onUpdateStep,
  onCompleteJourney,
}) => {
  const { t } = useI18n()
  const [activeStepIndex, setActiveStepIndex] = useState<number>(
    journey.currentStepIndex || 1,
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [stepNote, setStepNote] = useState<string>('')

  const activeStep: OnboardingStep | undefined = journey.steps.find(
    (s) => s.stepIndex === activeStepIndex,
  )

  const handleAdvanceStep = async (status: StepStatus) => {
    setLoading(true)
    try {
      await onUpdateStep(activeStepIndex, status, {
        notes: stepNote,
        completedTimestamp: new Date().toISOString(),
      })
      setStepNote('')
      if (activeStepIndex < 5) {
        setActiveStepIndex(activeStepIndex + 1)
      } else if (onCompleteJourney) {
        onCompleteJourney()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header com Progresso */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('onboarding.title')}</h2>
        <p className="text-xs text-gray-500 mt-1">{t('onboarding.subtitle')}</p>

        <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span className="font-semibold">{t('onboarding.progress')}</span>
            <span className="font-bold text-blue-600">{journey.progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${journey.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Tabs Horizontal */}
      <div className="grid grid-cols-5 gap-2 mb-8 border-b pb-4">
        {journey.steps.map((step) => {
          const isCurrent = step.stepIndex === activeStepIndex
          const isDone = step.status === 'COMPLETED'
          const isInProgress = step.status === 'IN_PROGRESS'

          return (
            <button
              key={step.stepIndex}
              onClick={() => setActiveStepIndex(step.stepIndex)}
              className={`text-left p-2 rounded border transition-all text-xs ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-700">Etapa {step.stepIndex}</span>
                {isDone ? (
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                ) : isInProgress ? (
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate font-medium">{step.title}</p>
            </button>
          )
        })}
      </div>

      {/* Conteúdo da Etapa Ativa */}
      {activeStep && (
        <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/50">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                {activeStep.code}
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-2">
                {activeStep.stepIndex}. {activeStep.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {activeStep.stepIndex === 1 &&
                  'Defina o nome de exibição, logotipo e paleta de cores primária e secundária para customização White-Label dos seus operadores.'}
                {activeStep.stepIndex === 2 &&
                  'Cadastre os veículos da sua frota estabelecendo a relação tripartite: Veículo, Proprietário e Empresa Vinculada.'}
                {activeStep.stepIndex === 3 &&
                  'Homologue os rastreadores IoT via recepção de telemetria telemática bruta (Suntech, Queclink, Teltonika) com persistência em Redis/MongoDB.'}
                {activeStep.stepIndex === 4 &&
                  'Atribua motoristas habilitados com CNH válida e configure limites de velocidade e regras de cercas operacionais.'}
                {activeStep.stepIndex === 5 &&
                  'Validação final dos módulos ativados. Liberação do painel principal para gestão de viagens, manutenção e rotas.'}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                activeStep.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-700'
                  : activeStep.status === 'IN_PROGRESS'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              {activeStep.status === 'COMPLETED'
                ? t('onboarding.completedBadge')
                : activeStep.status === 'IN_PROGRESS'
                  ? t('onboarding.inProgressBadge')
                  : t('onboarding.pendingBadge')}
            </span>
          </div>

          {/* Área de Metadados / Anotações da Etapa */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Observações operacionais ou parâmetros desta etapa:
            </label>
            <input
              type="text"
              value={stepNote}
              onChange={(e) => setStepNote(e.target.value)}
              placeholder="Ex: Logotipo importado, 15 caminhões cadastrados e 5 rastreadores validados..."
              className="w-full text-xs p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Botões de Ação */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                disabled={activeStepIndex === 1 || loading}
                onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                disabled={loading}
                onClick={() => handleAdvanceStep('IN_PROGRESS')}
                className="px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-800 rounded text-xs font-medium hover:bg-amber-100 disabled:opacity-50"
              >
                Salvar em Andamento
              </button>
            </div>

            <button
              disabled={loading}
              onClick={() => handleAdvanceStep('COMPLETED')}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {activeStepIndex === 5
                ? 'Concluir Implantação e Liberar Dashboard'
                : t('onboarding.completeStep')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


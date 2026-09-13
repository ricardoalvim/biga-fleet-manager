import React from 'react'
import type { PortalMenuTree, OnboardingJourney, SupportedLocale } from '../types/portal.types.js'
import { useI18n } from '../i18n/index.js'

interface TenantDashboardProps {
  readonly menuTree: PortalMenuTree
  readonly onboarding: OnboardingJourney
  readonly onNavigate: (path: string) => void
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  menuTree,
  onboarding,
  onNavigate,
}) => {
  const { locale, changeLocale, t } = useI18n()
  const { branding } = menuTree

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner com White-Label e i18n switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.displayName}
              className="h-12 w-12 object-contain rounded-lg"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-black text-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              BF
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{branding.displayName}</h1>
            <p className="text-xs text-gray-500">
              {t('nav.tenantTitle')} • Perfil: {menuTree.roleName}
            </p>
          </div>
        </div>

        {/* Seletor de Idioma em Tempo Real */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500">Idioma:</label>
          <select
            value={locale}
            onChange={(e) => changeLocale(e.target.value as SupportedLocale)}
            className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 font-medium text-gray-700 focus:outline-none focus:ring-1"
          >
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
            <option value="de-DE">Deutsch (DE)</option>
          </select>
        </div>
      </div>

      {/* Alerta de Onboarding se incompleto */}
      {!onboarding.isCompleted && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-blue-900">
              {t('onboarding.title')} ({onboarding.progressPercentage}% concluído)
            </h2>
            <p className="text-[11px] text-blue-700">
              Complete os 5 passos para calibrar o rastreamento, limites de cerca e telemetria da sua frota.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/app/onboarding')}
            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            Continuar Implantação
          </button>
        </div>
      )}

      {/* Cards de Métricas Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-medium">Veículos em Operação</span>
          <div className="text-2xl font-black text-gray-900">142</div>
          <span className="text-[11px] text-green-600 font-semibold">96% com telemetria ativa</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-medium">Viagens em Curso</span>
          <div className="text-2xl font-black text-gray-900">28</div>
          <span className="text-[11px] text-blue-600 font-semibold">0 desvios de rota detectados</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-medium">Alertas de Manutenção</span>
          <div className="text-2xl font-black text-amber-600">3</div>
          <span className="text-[11px] text-gray-500 font-medium">Revisões preventivas pendentes</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-2">
          <span className="text-xs text-gray-500 font-medium">Chamados de Suporte</span>
          <div className="text-2xl font-black text-gray-900">1</div>
          <span className="text-[11px] text-purple-600 font-semibold">Aguardando resposta da Biga</span>
        </div>
      </div>

      {/* Atalhos para os Módulos Autorizados */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Módulos Licenciados & Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {menuTree.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className="p-4 border rounded-xl hover:border-gray-300 hover:shadow-sm text-left transition-all group bg-gray-50/30"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate">{item.path}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


import React, { useState } from 'react'
import type { TenantAdminOverview } from '../types/portal.types.js'
import { useI18n } from '../i18n/index.js'

const AVAILABLE_MODULES = [
  'VEHICLES',
  'TRIPS',
  'MAINTENANCE',
  'INCIDENTS_TOLLS',
  'ROUTE_PLANNING',
  'TELEMETRY',
] as const

interface BigaAdminDashboardProps {
  readonly tenants: readonly TenantAdminOverview[]
  readonly onUpdateLicenses: (
    tenantId: string,
    enabledModules: readonly string[],
  ) => Promise<void>
}

export const BigaAdminDashboard: React.FC<BigaAdminDashboardProps> = ({
  tenants,
  onUpdateLicenses,
}) => {
  const { t } = useI18n()
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    tenants[0]?.tenantId ?? '',
  )
  const [editingModules, setEditingModules] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const tenant of tenants) {
      initial[tenant.tenantId] = [...tenant.enabledModules]
    }
    return initial
  })
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selectedTenant = tenants.find((t) => t.tenantId === selectedTenantId)
  const currentModules = editingModules[selectedTenantId] ?? []

  const toggleModule = (moduleKey: string) => {
    setEditingModules((prev) => {
      const active = prev[selectedTenantId] ?? []
      const updated = active.includes(moduleKey)
        ? active.filter((m) => m !== moduleKey)
        : [...active, moduleKey]
      return { ...prev, [selectedTenantId]: updated }
    })
  }

  const handleSaveLicenses = async () => {
    if (!selectedTenantId) return
    setSaving(true)
    setFeedback(null)
    try {
      await onUpdateLicenses(selectedTenantId, currentModules)
      setFeedback('Licenciamento atualizado com sucesso no ecossistema!')
    } catch {
      setFeedback('Erro ao persistir licenças do tenant.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('admin.title')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Painel Superadmin restrito à engenharia Biga Fleet para governança de multi-inquilinos
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-blue-800">
            <span className="font-bold">{tenants.length}</span> {t('admin.tenantsCount')}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Grid Principal: Lista de Tenants + Painel de Licenciamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Tenants */}
        <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Inquilinos Cadastrados
          </h2>
          <div className="space-y-1">
            {tenants.map((tenant) => {
              const isSelected = tenant.tenantId === selectedTenantId
              return (
                <button
                  key={tenant.tenantId}
                  onClick={() => setSelectedTenantId(tenant.tenantId)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-900'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate">{tenant.displayName}</span>
                    {tenant.isWhiteLabelConfigured && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                        White-Label
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono truncate">
                    {tenant.tenantId}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Coluna 2 e 3: Painel de Edição de Módulos e Licenças */}
        <div className="md:col-span-2 border rounded-xl p-6 bg-white shadow-sm space-y-6">
          {selectedTenant ? (
            <>
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedTenant.displayName}
                    </h3>
                    <p className="text-xs font-mono text-gray-400">
                      Tenant UUID: {selectedTenant.tenantId}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-800">
                    Ativo & Conectado
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                  Licenciamento Modular (Feature Flags)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map((moduleKey) => {
                    const isEnabled = currentModules.includes(moduleKey)
                    return (
                      <div
                        key={moduleKey}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                          isEnabled
                            ? 'border-blue-500 bg-blue-50/30'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800">{moduleKey}</p>
                          <span className="text-[10px] text-gray-500">
                            {moduleKey === 'VEHICLES' && 'Frota Tripartite & Ativos'}
                            {moduleKey === 'TRIPS' && 'Itinerários & Despacho'}
                            {moduleKey === 'MAINTENANCE' && 'Ordens de Serviço & TCO'}
                            {moduleKey === 'INCIDENTS_TOLLS' && 'Sinistros & ConectCar'}
                            {moduleKey === 'ROUTE_PLANNING' && 'Roteirização OSRM'}
                            {moduleKey === 'TELEMETRY' && 'Ingestão de Rastreadores IoT'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleModule(moduleKey)}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  disabled={saving}
                  onClick={handleSaveLicenses}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? t('common.loading') : t('admin.saveLicenses')}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-gray-400">
              Selecione um tenant para inspecionar e gerenciar as licenças operacionais.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


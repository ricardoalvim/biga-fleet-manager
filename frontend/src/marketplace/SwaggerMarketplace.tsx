import React, { useState } from 'react'
import type { MarketplaceCatalog, MarketplaceIntegration } from '../types/portal.types.js'
import { useI18n } from '../i18n/index.js'

interface SwaggerMarketplaceProps {
  readonly catalog: MarketplaceCatalog
  readonly onConnectIntegration?: (integrationId: string) => Promise<void>
}

export const SwaggerMarketplace: React.FC<SwaggerMarketplaceProps> = ({
  catalog,
  onConnectIntegration,
}) => {
  const { t } = useI18n()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const categories = ['ALL', ...Array.from(new Set(catalog.integrations.map((i) => i.category)))]

  const filteredIntegrations = catalog.integrations.filter((item: MarketplaceIntegration) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleConnect = async (integrationId: string) => {
    if (!onConnectIntegration) return
    setConnectingId(integrationId)
    try {
      await onConnectIntegration(integrationId)
    } finally {
      setConnectingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header com link do OpenAPI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('marketplace.title')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t('marketplace.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={catalog.openApiSpecUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
          >
            <span>OpenAPI v{catalog.version}</span>
            <span className="text-[10px] bg-blue-200 text-blue-800 px-1 rounded">JSON</span>
          </a>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        {/* Categorias */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Todas' : cat}
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')}
            className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Grid de Integrações Swagger-Driven */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIntegrations.map((item) => {
          const isConnecting = connectingId === item.id

          return (
            <div
              key={item.id}
              className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'REQUIRES_MODULE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.status === 'ACTIVE'
                      ? t('marketplace.connected')
                      : item.status === 'REQUIRES_MODULE'
                        ? `${t('marketplace.requiresModule')} (${item.requiredModule})`
                        : 'Disponível'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between gap-2">
                <a
                  href={item.apiDocsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  {t('marketplace.openDocs')} →
                </a>

                {item.status !== 'ACTIVE' ? (
                  <button
                    disabled={item.status === 'REQUIRES_MODULE' || isConnecting}
                    onClick={() => handleConnect(item.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isConnecting ? t('common.loading') : t('marketplace.connect')}
                  </button>
                ) : (
                  <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Ativo
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


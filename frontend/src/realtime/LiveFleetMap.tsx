import React, { useState } from 'react'
import type { LiveVehicleState } from './types.js'
import { useTelemetryStream, type LiveAlert } from './useTelemetryStream.js'

interface LiveFleetMapProps {
  readonly tenantId?: string
  readonly primaryColor?: string
  readonly onSelectVehicle?: (vehicle: LiveVehicleState) => void
}

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({
  tenantId = '00000000-0000-4000-8000-000000000001',
  primaryColor = '#1E3A8A',
  onSelectVehicle,
}) => {
  const { vehicles, alerts, connectionStatus, reconnect } = useTelemetryStream(tenantId)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'ALL' | 'MOVING' | 'STOPPED'>('ALL')

  const filteredVehicles = vehicles.filter((v) => {
    if (filterMode === 'MOVING') return v.speed > 0
    if (filterMode === 'STOPPED') return v.speed === 0
    return true
  })

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId)

  const handleSelect = (v: LiveVehicleState) => {
    setSelectedVehicleId(v.vehicleId)
    if (onSelectVehicle) onSelectVehicle(v)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto p-4 gap-4">
      {/* Top Bar de Status e Controles */}
      <div className="bg-white rounded-xl p-4 border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-green-500 animate-pulse'
                  : connectionStatus === 'CONNECTING'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Stream SSE: {connectionStatus}
            </span>
          </div>

          {connectionStatus !== 'CONNECTED' && (
            <button
              onClick={reconnect}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-gray-700"
            >
              Reconectar
            </button>
          )}

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <span className="text-xs text-gray-500 font-medium">
            <strong className="text-gray-900">{vehicles.length}</strong> ativos rastreados em tempo real
          </span>
        </div>

        {/* Filtros de Frota */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'ALL'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({vehicles.length})
          </button>
          <button
            onClick={() => setFilterMode('MOVING')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'MOVING'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Em Movimento ({vehicles.filter((v) => v.speed > 0).length})
          </button>
          <button
            onClick={() => setFilterMode('STOPPED')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'STOPPED'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Parados ({vehicles.filter((v) => v.speed === 0).length})
          </button>
        </div>
      </div>

      {/* Área Central: Grid Mapa + Lateral de Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Painel do Mapa Interativo */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner flex flex-col relative overflow-hidden">
          {/* Header Superior do Mapa */}
          <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-2">
            <span>Visão Cartográfica em Tempo Real</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-mono">Throttle: 3.000ms / ativo</span>
          </div>

          {/* Canvas / Viewport Simulado de Mapa com Marcadores de Veículos */}
          <div className="flex-1 w-full h-full relative p-6 flex items-center justify-center">
            {filteredVehicles.length === 0 ? (
              <div className="text-center text-slate-400 text-xs space-y-2">
                <p>Aguardando pacotes telemáticos via Redis / SSE...</p>
                <span className="text-[10px] text-slate-500">
                  Os marcadores de telemetria aparecerão automaticamente conforme emitidos.
                </span>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {filteredVehicles.map((vehicle, index) => {
                  const isSelected = vehicle.vehicleId === selectedVehicleId

                  // Posicionamento visual simulado na grade geográfica
                  const topPercent = 20 + ((index * 17) % 65)
                  const leftPercent = 15 + ((index * 23) % 70)

                  return (
                    <div
                      key={vehicle.vehicleId}
                      onClick={() => handleSelect(vehicle)}
                      style={{
                        top: `${topPercent}%`,
                        left: `${leftPercent}%`,
                      }}
                      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out group ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                      }`}
                    >
                      {/* Marcador com Heading Giratório */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center shadow-lg border-2 ${
                            vehicle.ignition
                              ? 'bg-blue-600 border-white text-white'
                              : 'bg-slate-700 border-slate-400 text-slate-300'
                          }`}
                          style={{
                            backgroundColor: vehicle.ignition ? primaryColor : undefined,
                            boxShadow: isSelected
                              ? '0 0 15px rgba(59, 130, 246, 0.8)'
                              : undefined,
                          }}
                        >
                          {/* Seta indicadora do azimute (heading) */}
                          <span
                            className="inline-block transform font-black text-xs"
                            style={{
                              transform: `rotate(${vehicle.heading}deg)`,
                            }}
                          >
                            ▲
                          </span>
                        </div>

                        {/* Tag Flutuante com Placa / Velocidade */}
                        <div className="mt-1 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                          {vehicle.plate ?? vehicle.vehicleId.slice(0, 8)} • {Math.round(vehicle.speed)} km/h
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Card Flutuante de Detalhes do Veículo Selecionado */}
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-slate-950/95 backdrop-blur-md rounded-xl p-4 border border-slate-800 text-slate-200 z-30 shadow-2xl space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {selectedVehicle.plate ?? selectedVehicle.vehicleId}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedVehicle.vehicleId}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVehicleId(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 block">Velocidade</span>
                  <strong className="text-white text-sm">{Math.round(selectedVehicle.speed)} km/h</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 block">Rumo / Azimute</span>
                  <strong className="text-white text-sm">{Math.round(selectedVehicle.heading)}°</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 block">Ignição</span>
                  <span
                    className={`font-bold ${
                      selectedVehicle.ignition ? 'text-green-400' : 'text-slate-400'
                    }`}
                  >
                    {selectedVehicle.ignition ? 'LIGADA' : 'DESLIGADA'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-slate-500 block">Coordenadas</span>
                  <span className="font-mono text-[10px] text-slate-300">
                    {selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {selectedVehicle.lastAlert && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px]">
                  <strong>Último Alerta:</strong> {selectedVehicle.lastAlert.action} em {selectedVehicle.lastAlert.geofenceName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel Lateral: Alertas em Tempo Real (Geofencing & Violações) */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col space-y-3 overflow-hidden">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Alertas ao Vivo ({alerts.length})
            </h3>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                Nenhum alerta de cerca virtual ou excesso de velocidade detectado no momento.
              </div>
            ) : (
              alerts.map((alert: LiveAlert) => (
                <div
                  key={alert.id}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900 text-[11px]">
                      {alert.action === 'ENTER' && '🟢 Entrada em Cerca'}
                      {alert.action === 'EXIT' && '🔴 Saída de Cerca'}
                      {alert.action === 'SPEEDING_VIOLATION' && '⚠️ Excesso de Velocidade'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium">
                    {alert.geofenceName}
                  </p>
                  <span className="text-[10px] text-gray-500 font-mono block">
                    Ativo: {alert.vehicleId.slice(0, 8)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LiveVehicleState, RealtimeStreamMessage } from './types.js'

export type StreamConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

export interface LiveAlert {
  readonly id: string
  readonly vehicleId: string
  readonly geofenceName: string
  readonly action: 'ENTER' | 'EXIT' | 'SPEEDING_VIOLATION'
  readonly timestamp: string
}

export function useTelemetryStream(
  tenantId = '00000000-0000-4000-8000-000000000001',
  streamUrl = '/api/v1/stream/telemetry',
) {
  const [vehiclesMap, setVehiclesMap] = useState<Map<string, LiveVehicleState>>(new Map())
  const [alerts, setAlerts] = useState<readonly LiveAlert[]>([])
  const [connectionStatus, setConnectionStatus] = useState<StreamConnectionStatus>('DISCONNECTED')
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnectionStatus('CONNECTING')

    const url = new URL(streamUrl, window.location.origin)
    url.searchParams.set('tenantId', tenantId)

    const eventSource = new EventSource(url.toString())
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnectionStatus('CONNECTED')
    }

    eventSource.onerror = () => {
      setConnectionStatus('ERROR')
      eventSource.close()
    }

    // Handler para vehicle.position.updated
    eventSource.addEventListener('vehicle.position.updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as RealtimeStreamMessage
        const pos = payload.data as {
          latitude: number
          longitude: number
          speed: number
          heading: number
          ignition: boolean
          timestamp: string
          odometerKm?: number
          fuelLevelPercent?: number
        }

        setVehiclesMap((prev) => {
          const next = new Map(prev)
          const existing = next.get(payload.vehicleId)

          next.set(payload.vehicleId, {
            vehicleId: payload.vehicleId,
            plate: existing?.plate,
            latitude: pos.latitude,
            longitude: pos.longitude,
            speed: pos.speed,
            heading: pos.heading,
            ignition: pos.ignition,
            timestamp: pos.timestamp ?? payload.timestamp,
            odometerKm: pos.odometerKm ?? existing?.odometerKm,
            fuelLevelPercent: pos.fuelLevelPercent ?? existing?.fuelLevelPercent,
            lastAlert: existing?.lastAlert,
          })
          return next
        })
      } catch {
        // Ignora pacotes mal formatados
      }
    })

    // Handler para geofence.alert
    eventSource.addEventListener('geofence.alert', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as RealtimeStreamMessage
        const alertData = payload.data as {
          geofenceName: string
          action: 'ENTER' | 'EXIT' | 'SPEEDING_VIOLATION'
          timestamp: string
        }

        const newAlert: LiveAlert = {
          id: crypto.randomUUID(),
          vehicleId: payload.vehicleId,
          geofenceName: alertData.geofenceName,
          action: alertData.action,
          timestamp: alertData.timestamp ?? payload.timestamp,
        }

        setAlerts((prev) => [newAlert, ...prev.slice(0, 49)])

        setVehiclesMap((prev) => {
          const next = new Map(prev)
          const existing = next.get(payload.vehicleId)
          if (existing) {
            next.set(payload.vehicleId, {
              ...existing,
              lastAlert: {
                geofenceName: alertData.geofenceName,
                action: alertData.action,
                timestamp: alertData.timestamp,
              },
            })
          }
          return next
        })
      } catch {
        // Ignora pacotes mal formatados
      }
    })
  }, [tenantId, streamUrl])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect])

  const vehicles = Array.from(vehiclesMap.values())

  return {
    vehicles,
    alerts,
    connectionStatus,
    reconnect: connect,
  }
}


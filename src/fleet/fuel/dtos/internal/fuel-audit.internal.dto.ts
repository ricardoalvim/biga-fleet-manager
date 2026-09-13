import type { FuelAuditStatus, FuelAuditType, GasStationLocation } from '../../entities/fuel-audit-record.entity.js'

export class FuelAuditInternalDto {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly driverId?: string
  readonly plate: string
  readonly gasStation: GasStationLocation
  readonly timestamp: string
  readonly fuelType: FuelAuditType
  readonly liters: number
  readonly pricePerLiter: number
  readonly totalValue: number
  readonly reportedOdometerKm: number
  readonly status: FuelAuditStatus
  readonly fraudRiskScore: number
  readonly fraudSignals: ReadonlyArray<string>
  readonly mitigatingFactors: ReadonlyArray<string>
  readonly reconciledAt: string
  readonly notes?: string

  constructor(data: {
    readonly id: string
    readonly tenantId: string
    readonly vehicleId: string
    readonly driverId?: string
    readonly plate: string
    readonly gasStation: GasStationLocation
    readonly timestamp: string
    readonly fuelType: FuelAuditType
    readonly liters: number
    readonly pricePerLiter: number
    readonly totalValue: number
    readonly reportedOdometerKm: number
    readonly status: FuelAuditStatus
    readonly fraudRiskScore: number
    readonly fraudSignals: ReadonlyArray<string>
    readonly mitigatingFactors: ReadonlyArray<string>
    readonly reconciledAt: string
    readonly notes?: string
  }) {
    this.id = data.id
    this.tenantId = data.tenantId
    this.vehicleId = data.vehicleId
    this.driverId = data.driverId
    this.plate = data.plate
    this.gasStation = data.gasStation
    this.timestamp = data.timestamp
    this.fuelType = data.fuelType
    this.liters = data.liters
    this.pricePerLiter = data.pricePerLiter
    this.totalValue = data.totalValue
    this.reportedOdometerKm = data.reportedOdometerKm
    this.status = data.status
    this.fraudRiskScore = data.fraudRiskScore
    this.fraudSignals = Object.freeze([...data.fraudSignals])
    this.mitigatingFactors = Object.freeze([...data.mitigatingFactors])
    this.reconciledAt = data.reconciledAt
    this.notes = data.notes
    Object.freeze(this)
  }
}

export interface FuelAuditMetricsInternalDto {
  readonly tenantId: string
  readonly totalReconciled: number
  readonly approvedCount: number
  readonly suspectCount: number
  readonly rejectedCount: number
  readonly totalAmountSpent: number
  readonly totalLitersSupplied: number
  readonly totalSuspectAmount: number
  readonly commonFraudSignals: ReadonlyArray<{ signal: string; count: number }>
}


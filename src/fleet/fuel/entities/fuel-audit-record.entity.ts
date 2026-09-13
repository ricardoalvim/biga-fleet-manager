export type FuelAuditStatus = 'APPROVED' | 'SUSPECT' | 'REJECTED'

export type FuelAuditType =
  | 'DIESEL_S10'
  | 'DIESEL_S500'
  | 'GASOLINE'
  | 'ETHANOL'
  | 'CNG'
  | 'ARLA32'

export interface GasStationLocation {
  readonly name: string
  readonly cnpj?: string
  readonly latitude: number
  readonly longitude: number
  readonly address?: string
}

export interface FuelAuditRecordProps {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly driverId?: string
  readonly plate: string
  readonly gasStation: GasStationLocation
  readonly timestamp: Date
  readonly fuelType: FuelAuditType
  readonly liters: number
  readonly pricePerLiter: number
  readonly totalValue: number
  readonly reportedOdometerKm: number
  readonly status: FuelAuditStatus
  readonly fraudRiskScore: number
  readonly fraudSignals: ReadonlyArray<string>
  readonly mitigatingFactors: ReadonlyArray<string>
  readonly reconciledAt: Date
  readonly notes?: string
}

export class FuelAuditRecordEntity {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly driverId?: string
  readonly plate: string
  readonly gasStation: GasStationLocation
  readonly timestamp: Date
  readonly fuelType: FuelAuditType
  readonly liters: number
  readonly pricePerLiter: number
  readonly totalValue: number
  readonly reportedOdometerKm: number
  readonly status: FuelAuditStatus
  readonly fraudRiskScore: number
  readonly fraudSignals: ReadonlyArray<string>
  readonly mitigatingFactors: ReadonlyArray<string>
  readonly reconciledAt: Date
  readonly notes?: string

  constructor(props: FuelAuditRecordProps) {
    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.driverId = props.driverId
    this.plate = props.plate.toUpperCase().trim()
    this.gasStation = props.gasStation
    this.timestamp = props.timestamp
    this.fuelType = props.fuelType
    this.liters = props.liters
    this.pricePerLiter = props.pricePerLiter
    this.totalValue = props.totalValue
    this.reportedOdometerKm = props.reportedOdometerKm
    this.status = props.status
    this.fraudRiskScore = props.fraudRiskScore
    this.fraudSignals = Object.freeze([...props.fraudSignals])
    this.mitigatingFactors = Object.freeze([...props.mitigatingFactors])
    this.reconciledAt = props.reconciledAt
    this.notes = props.notes
  }

  isFraudulent(): boolean {
    return this.status === 'REJECTED' || this.fraudRiskScore >= 70
  }

  isSuspect(): boolean {
    return this.status === 'SUSPECT' || (this.fraudRiskScore >= 40 && this.fraudRiskScore < 70)
  }
}


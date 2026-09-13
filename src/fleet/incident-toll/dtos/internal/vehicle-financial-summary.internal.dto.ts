export interface VehicleFinancialSummaryDtoProps {
  readonly vehicleId: string
  readonly vehiclePlate: string
  readonly totalTollAmount: number
  readonly tollPassageCount: number
  readonly totalEstimatedIncidentCost: number
  readonly totalActualIncidentCost: number
  readonly incidentCount: number
  readonly totalCombinedCost: number
}

export class VehicleFinancialSummaryDto {
  readonly vehicleId: string
  readonly vehiclePlate: string
  readonly totalTollAmount: number
  readonly tollPassageCount: number
  readonly totalEstimatedIncidentCost: number
  readonly totalActualIncidentCost: number
  readonly incidentCount: number
  readonly totalCombinedCost: number

  constructor(props: VehicleFinancialSummaryDtoProps) {
    this.vehicleId = props.vehicleId
    this.vehiclePlate = props.vehiclePlate
    this.totalTollAmount = props.totalTollAmount
    this.tollPassageCount = props.tollPassageCount
    this.totalEstimatedIncidentCost = props.totalEstimatedIncidentCost
    this.totalActualIncidentCost = props.totalActualIncidentCost
    this.incidentCount = props.incidentCount
    this.totalCombinedCost = props.totalCombinedCost

    Object.freeze(this)
  }
}

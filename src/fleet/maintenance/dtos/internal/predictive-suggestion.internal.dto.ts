import type { MaintenancePlanItemDto } from './maintenance-plan.internal.dto.js'

export type PredictiveSuggestionStatus = 'DUE' | 'OVERDUE' | 'UPCOMING'

export interface PredictiveSuggestionDtoProps {
  readonly planId: string
  readonly planName: string
  readonly triggerKm: number
  readonly currentKm: number
  readonly kmDifference: number
  readonly status: PredictiveSuggestionStatus
  readonly items: ReadonlyArray<MaintenancePlanItemDto>
}

export class PredictiveSuggestionDto {
  readonly planId: string
  readonly planName: string
  readonly triggerKm: number
  readonly currentKm: number
  readonly kmDifference: number
  readonly status: PredictiveSuggestionStatus
  readonly items: ReadonlyArray<MaintenancePlanItemDto>

  constructor(props: PredictiveSuggestionDtoProps) {
    this.planId = props.planId
    this.planName = props.planName
    this.triggerKm = props.triggerKm
    this.currentKm = props.currentKm
    this.kmDifference = props.kmDifference
    this.status = props.status
    this.items = Object.freeze([...props.items])

    Object.freeze(this)
  }
}

export interface VehicleMaintenanceSuggestionsDtoProps {
  readonly vehicleId: string
  readonly vehiclePlate: string
  readonly currentKm: number
  readonly suggestions: ReadonlyArray<PredictiveSuggestionDto>
}

export class VehicleMaintenanceSuggestionsDto {
  readonly vehicleId: string
  readonly vehiclePlate: string
  readonly currentKm: number
  readonly suggestions: ReadonlyArray<PredictiveSuggestionDto>

  constructor(props: VehicleMaintenanceSuggestionsDtoProps) {
    this.vehicleId = props.vehicleId
    this.vehiclePlate = props.vehiclePlate
    this.currentKm = props.currentKm
    this.suggestions = Object.freeze([...props.suggestions])

    Object.freeze(this)
  }
}

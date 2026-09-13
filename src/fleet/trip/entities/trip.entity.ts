export interface TripEntityProps {
  id: string
  tenantId: string
  vehicleId: string
  startedAt: Date
  endedAt?: Date | null
  distanceKm?: number
  ignition: boolean
}

export class TripEntity {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly startedAt: Date
  readonly endedAt: Date | null
  readonly distanceKm: number
  readonly ignition: boolean

  constructor(props: TripEntityProps) {
    if (!props.tenantId?.trim()) {
      throw new Error('Tenant ID é obrigatório para a viagem')
    }
    if (!props.vehicleId?.trim()) {
      throw new Error('Vehicle ID é obrigatório para a viagem')
    }
    if (props.distanceKm !== undefined && props.distanceKm < 0) {
      throw new Error('Distância da viagem não pode ser negativa')
    }
    if (props.endedAt && props.endedAt < props.startedAt) {
      throw new Error('Horário de término não pode ser anterior ao horário de início')
    }

    this.id = props.id
    this.tenantId = props.tenantId
    this.vehicleId = props.vehicleId
    this.startedAt = props.startedAt
    this.endedAt = props.endedAt ?? null
    this.distanceKm = props.distanceKm ?? 0
    this.ignition = props.ignition

    Object.freeze(this)
  }

  static create(tenantId: string, vehicleId: string, id = crypto.randomUUID()): TripEntity {
    return new TripEntity({
      id,
      tenantId,
      vehicleId,
      startedAt: new Date(),
      endedAt: null,
      distanceKm: 0,
      ignition: true,
    })
  }

  finish(endedAt: Date, distanceKm: number): TripEntity {
    if (this.endedAt) {
      throw new Error('Viagem já se encontra finalizada')
    }
    if (distanceKm < 0) {
      throw new Error('Distância da viagem não pode ser negativa')
    }
    if (endedAt < this.startedAt) {
      throw new Error('Horário de término não pode ser anterior ao início')
    }

    return new TripEntity({
      id: this.id,
      tenantId: this.tenantId,
      vehicleId: this.vehicleId,
      startedAt: this.startedAt,
      endedAt,
      distanceKm: Number(distanceKm.toFixed(2)),
      ignition: false,
    })
  }
}

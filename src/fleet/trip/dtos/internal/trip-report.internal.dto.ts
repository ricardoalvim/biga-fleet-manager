export interface TripRoutePointProps {
  readonly lat: number
  readonly lng: number
  readonly speed: number
  readonly time: Date
  readonly address: string
}

export class TripRoutePointDto {
  readonly lat: number
  readonly lng: number
  readonly speed: number
  readonly time: Date
  readonly address: string

  constructor(props: TripRoutePointProps) {
    this.lat = props.lat
    this.lng = props.lng
    this.speed = props.speed
    this.time = props.time
    this.address = props.address

    Object.freeze(this)
  }
}

export interface TripStatsProps {
  readonly distanceKm: number
  readonly avgSpeed: number
  readonly pointCount: number
}

export class TripStatsDto {
  readonly distanceKm: number
  readonly avgSpeed: number
  readonly pointCount: number

  constructor(props: TripStatsProps) {
    this.distanceKm = props.distanceKm
    this.avgSpeed = props.avgSpeed
    this.pointCount = props.pointCount

    Object.freeze(this)
  }
}

export interface TripReportInternalDtoProps {
  readonly id: string
  readonly vehiclePlate: string
  readonly startAddress: string
  readonly endAddress: string
  readonly stats: TripStatsDto
  readonly route: ReadonlyArray<TripRoutePointDto>
}

export class TripReportInternalDto {
  readonly id: string
  readonly vehiclePlate: string
  readonly startAddress: string
  readonly endAddress: string
  readonly stats: TripStatsDto
  readonly route: ReadonlyArray<TripRoutePointDto>

  constructor(props: TripReportInternalDtoProps) {
    this.id = props.id
    this.vehiclePlate = props.vehiclePlate
    this.startAddress = props.startAddress
    this.endAddress = props.endAddress
    this.stats = props.stats
    this.route = Object.freeze([...props.route])

    Object.freeze(this)
  }
}

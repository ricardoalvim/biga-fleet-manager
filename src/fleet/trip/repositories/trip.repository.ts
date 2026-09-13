import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PrismaService } from '../../../platform/persistence/prisma.service.js'
import { Telemetry } from '../../../telemetry/telemetry.document.js'
import { TripInternalDto, TripVehicleSummaryDto } from '../dtos/internal/trip.internal.dto.js'
import type { StartTripInternalDto } from '../dtos/internal/start-trip.internal.dto.js'
import type { FinishTripInternalDto } from '../dtos/internal/finish-trip.internal.dto.js'

export interface TelemetryPointRecord {
  readonly latitude: number
  readonly longitude: number
  readonly speed: number
  readonly timestamp: Date
}

interface RawVehicleRelation {
  readonly id: string
  readonly plate: string
  readonly model?: string | null
}

interface RawTripRecord {
  readonly id: string
  readonly tenantId: string
  readonly vehicleId: string
  readonly startedAt: string
  readonly endedAt?: string | null
  readonly distanceKm: number
  readonly ignition: boolean
  readonly vehicle?: RawVehicleRelation | null
}

@Injectable()
export class TripRepository {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
  ) {}

  async create(dto: Readonly<StartTripInternalDto>): Promise<Readonly<TripInternalDto>> {
    const record = await this.prisma.orm.Trip.create({
      tenantId: dto.tenantId,
      vehicleId: dto.vehicleId,
      ignition: true,
    })

    return this.mapToInternalDto(record)
  }

  async findActiveByVehicle(
    tenantId: string,
    vehicleId: string,
  ): Promise<Readonly<TripInternalDto> | null> {
    const record = await this.prisma.orm.Trip.where({
      tenantId,
      vehicleId,
      endedAt: null,
    })
      .include('vehicle')
      .first()

    return record ? this.mapToInternalDto(record) : null
  }

  async findById(tenantId: string, id: string): Promise<Readonly<TripInternalDto> | null> {
    const record = await this.prisma.orm.Trip.where({ id, tenantId }).include('vehicle').first()

    return record ? this.mapToInternalDto(record) : null
  }

  async findActiveTrips(tenantId: string): Promise<ReadonlyArray<Readonly<TripInternalDto>>> {
    const records = await this.prisma.orm.Trip.where({
      tenantId,
      endedAt: null,
    })
      .include('vehicle')
      .orderBy((t) => t.startedAt.desc())
      .all()

    return Object.freeze(records.map((r) => this.mapToInternalDto(r)))
  }

  async finishTrip(dto: Readonly<FinishTripInternalDto>): Promise<Readonly<TripInternalDto>> {
    const record = await this.prisma.orm.Trip.where({ id: dto.tripId }).update({
      endedAt: dto.endedAt,
      ignition: false,
      distanceKm: dto.distanceKm,
    })

    if (!record) {
      throw new Error(`Falha ao atualizar viagem ${dto.tripId}: registro não encontrado`)
    }

    return this.mapToInternalDto(record)
  }

  async getTelemetryPoints(tripId: string): Promise<ReadonlyArray<TelemetryPointRecord>> {
    const points = await this.telemetryModel.find({ tripId }).sort({ timestamp: 1 }).lean()

    return Object.freeze(
      points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        speed: p.speed ?? 0,
        timestamp: p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp),
      })),
    )
  }

  private mapToInternalDto(raw: RawTripRecord): Readonly<TripInternalDto> {
    return new TripInternalDto({
      id: raw.id,
      tenantId: raw.tenantId,
      vehicleId: raw.vehicleId,
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      distanceKm: raw.distanceKm,
      ignition: raw.ignition,
      vehicle: raw.vehicle
        ? new TripVehicleSummaryDto({
            id: raw.vehicle.id,
            plate: raw.vehicle.plate,
            model: raw.vehicle.model ?? undefined,
          })
        : undefined,
    })
  }
}

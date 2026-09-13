import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RouteProfileDocument } from '../schemas/route-profile.document.js'
import { PlannedRouteDocument } from '../schemas/planned-route.document.js'
import type { BusinessContext } from '../entities/route-profile.entity.js'
import type { PlannedRouteStatus } from '../entities/planned-route.entity.js'
import { RouteProfileInternalDto } from '../dtos/internal/route-profile.internal.dto.js'
import type { CreateRouteProfileInternalDto } from '../dtos/internal/create-route-profile.internal.dto.js'
import { PlannedRouteInternalDto } from '../dtos/internal/planned-route.internal.dto.js'
import type { SavePlannedRouteInternalDto } from '../dtos/internal/calculate-route.internal.dto.js'

export interface ProfileFilterOptions {
  readonly businessContext?: string
}

export interface RouteFilterOptions {
  readonly vehicleId?: string
  readonly profileId?: string
  readonly status?: string
}

interface RawProfileRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly name: string
  readonly businessContext: BusinessContext
  readonly customTerminology: {
    readonly stopPointLabel: string
    readonly assetLabel: string
    readonly routeLabel: string
  }
  readonly physicalConstraints: {
    readonly maxWeightTons: number
    readonly maxHeightMeters: number
    readonly allowUnpavedRoads: boolean
    readonly maxSpeedKmh: number
  }
  readonly createdAt: Date
  readonly updatedAt: Date
}

interface RawGeoPointRecord {
  readonly latitude: number
  readonly longitude: number
  readonly address?: string | null
}

interface RawWaypointRecord {
  readonly latitude: number
  readonly longitude: number
  readonly sequence: number
  readonly address?: string | null
}

interface RawPlannedRouteRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly profileId: string
  readonly vehicleId: string
  readonly origin: RawGeoPointRecord
  readonly destination: RawGeoPointRecord
  readonly waypoints: ReadonlyArray<RawWaypointRecord>
  readonly distanceKm: number
  readonly estimatedDurationMinutes: number
  readonly projectedFuelLiters: number
  readonly status: PlannedRouteStatus
  readonly dispatchedAt?: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

@Injectable()
export class RoutePlanningRepository {
  constructor(
    @InjectModel(RouteProfileDocument.name)
    private readonly profileModel: Model<RouteProfileDocument>,
    @InjectModel(PlannedRouteDocument.name)
    private readonly routeModel: Model<PlannedRouteDocument>,
  ) {}

  async createProfile(
    dto: Readonly<CreateRouteProfileInternalDto>,
  ): Promise<Readonly<RouteProfileInternalDto>> {
    const doc = await this.profileModel.create({
      _id: dto.id,
      tenantId: dto.tenantId,
      name: dto.name,
      businessContext: dto.businessContext,
      customTerminology: dto.customTerminology,
      physicalConstraints: dto.physicalConstraints,
    })

    return this.mapProfileToDto(doc.toObject())
  }

  async findProfileById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<RouteProfileInternalDto> | null> {
    const doc = await this.profileModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapProfileToDto(doc) : null
  }

  async findProfiles(
    tenantId: string,
    filters?: ProfileFilterOptions,
  ): Promise<ReadonlyArray<Readonly<RouteProfileInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.businessContext) {
      query.businessContext = filters.businessContext
    }

    const docs = await this.profileModel.find(query).sort({ createdAt: -1 }).lean()
    return Object.freeze(docs.map((d) => this.mapProfileToDto(d as unknown as RawProfileRecord)))
  }

  async createPlannedRoute(
    dto: Readonly<SavePlannedRouteInternalDto>,
  ): Promise<Readonly<PlannedRouteInternalDto>> {
    const doc = await this.routeModel.create({
      _id: dto.id,
      tenantId: dto.tenantId,
      profileId: dto.profileId,
      vehicleId: dto.vehicleId,
      origin: {
        latitude: dto.origin.latitude,
        longitude: dto.origin.longitude,
        address: dto.origin.address ?? null,
      },
      destination: {
        latitude: dto.destination.latitude,
        longitude: dto.destination.longitude,
        address: dto.destination.address ?? null,
      },
      waypoints: dto.waypoints.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        sequence: wp.sequence,
        address: wp.address ?? null,
      })),
      distanceKm: dto.distanceKm,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
      projectedFuelLiters: dto.projectedFuelLiters,
      status: dto.status,
      dispatchedAt: dto.dispatchedAt,
    })

    return this.mapRouteToDto(doc.toObject())
  }

  async findRouteById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<PlannedRouteInternalDto> | null> {
    const doc = await this.routeModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapRouteToDto(doc) : null
  }

  async findRoutes(
    tenantId: string,
    filters?: RouteFilterOptions,
  ): Promise<ReadonlyArray<Readonly<PlannedRouteInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.vehicleId) query.vehicleId = filters.vehicleId
    if (filters?.profileId) query.profileId = filters.profileId
    if (filters?.status) query.status = filters.status

    const docs = await this.routeModel.find(query).sort({ createdAt: -1 }).lean()
    return Object.freeze(docs.map((d) => this.mapRouteToDto(d as unknown as RawPlannedRouteRecord)))
  }

  async updateRouteStatus(
    tenantId: string,
    id: string,
    status: PlannedRouteStatus,
    dispatchedAt?: Date | null,
  ): Promise<Readonly<PlannedRouteInternalDto> | null> {
    const updateData: Record<string, unknown> = { status }
    if (dispatchedAt !== undefined) {
      updateData.dispatchedAt = dispatchedAt
    }

    const doc = await this.routeModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: updateData }, { new: true })
      .lean()

    return doc ? this.mapRouteToDto(doc) : null
  }

  private mapProfileToDto(raw: RawProfileRecord): Readonly<RouteProfileInternalDto> {
    return new RouteProfileInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      name: raw.name,
      businessContext: raw.businessContext,
      customTerminology: {
        stopPointLabel: raw.customTerminology.stopPointLabel,
        assetLabel: raw.customTerminology.assetLabel,
        routeLabel: raw.customTerminology.routeLabel,
      },
      physicalConstraints: {
        maxWeightTons: raw.physicalConstraints.maxWeightTons,
        maxHeightMeters: raw.physicalConstraints.maxHeightMeters,
        allowUnpavedRoads: raw.physicalConstraints.allowUnpavedRoads,
        maxSpeedKmh: raw.physicalConstraints.maxSpeedKmh,
      },
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }

  private mapRouteToDto(raw: RawPlannedRouteRecord): Readonly<PlannedRouteInternalDto> {
    return new PlannedRouteInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      profileId: raw.profileId,
      vehicleId: raw.vehicleId,
      origin: {
        latitude: raw.origin.latitude,
        longitude: raw.origin.longitude,
        address: raw.origin.address ?? undefined,
      },
      destination: {
        latitude: raw.destination.latitude,
        longitude: raw.destination.longitude,
        address: raw.destination.address ?? undefined,
      },
      waypoints: raw.waypoints.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        sequence: wp.sequence,
        address: wp.address ?? undefined,
      })),
      distanceKm: raw.distanceKm,
      estimatedDurationMinutes: raw.estimatedDurationMinutes,
      projectedFuelLiters: raw.projectedFuelLiters,
      status: raw.status,
      dispatchedAt: raw.dispatchedAt
        ? raw.dispatchedAt instanceof Date
          ? raw.dispatchedAt.toISOString()
          : String(raw.dispatchedAt)
        : null,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
      updatedAt:
        raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt),
    })
  }
}

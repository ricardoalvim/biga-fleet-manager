import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import { MapUtils } from '../../../platform/geo/map.utils.js'
import { RouteProfileEntity, type BusinessContext } from '../entities/route-profile.entity.js'
import { PlannedRouteEntity, type Waypoint } from '../entities/planned-route.entity.js'
import { CreateRouteProfileInternalDto } from '../dtos/internal/create-route-profile.internal.dto.js'
import { RouteProfileInternalDto } from '../dtos/internal/route-profile.internal.dto.js'
import { SavePlannedRouteInternalDto } from '../dtos/internal/calculate-route.internal.dto.js'
import {
  PlannedRouteInternalDto,
  RouteVehicleSummaryDto,
} from '../dtos/internal/planned-route.internal.dto.js'
import type { CreateRouteProfileDto } from '../dtos/external/create-route-profile.dto.js'
import type { CalculateRouteDto } from '../dtos/external/calculate-route.dto.js'
import {
  RoutePlanningRepository,
  type ProfileFilterOptions,
  type RouteFilterOptions,
} from '../repositories/route-planning.repository.js'
import { RoutePlanningExternalService } from './route-planning.external.service.js'

export const CONTEXT_FACTORS: Record<
  BusinessContext,
  { defaultAvgSpeedKmh: number; fuelRateLitersPerKm: number }
> = {
  DELIVERY: { defaultAvgSpeedKmh: 50, fuelRateLitersPerKm: 0.12 },
  PASSENGER: { defaultAvgSpeedKmh: 60, fuelRateLitersPerKm: 0.28 },
  HEAVY_CARGO: { defaultAvgSpeedKmh: 55, fuelRateLitersPerKm: 0.42 },
  AGRICULTURAL: { defaultAvgSpeedKmh: 25, fuelRateLitersPerKm: 0.65 },
}

@Injectable()
export class RoutePlanningInternalService {
  constructor(
    private readonly repository: RoutePlanningRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly externalService: RoutePlanningExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  async createProfile(
    dto: CreateRouteProfileDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<RouteProfileInternalDto>> {
    let entity: RouteProfileEntity
    try {
      entity = new RouteProfileEntity({
        id: crypto.randomUUID(),
        tenantId,
        name: dto.name,
        businessContext: dto.businessContext,
        customTerminology: dto.customTerminology,
        physicalConstraints: dto.physicalConstraints,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    const internalDto = new CreateRouteProfileInternalDto({
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      businessContext: entity.businessContext,
      customTerminology: entity.customTerminology,
      physicalConstraints: entity.physicalConstraints,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    })

    return this.repository.createProfile(internalDto)
  }

  async getProfileById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<RouteProfileInternalDto>> {
    const profile = await this.repository.findProfileById(tenantId, id)
    if (!profile) {
      throw new NotFoundException('Perfil de rota não encontrado para o tenant informado', {
        errorCode: 'FLEET-0015',
      })
    }
    return profile
  }

  async listProfiles(
    tenantId = this.tenantContext.tenantId,
    filters?: ProfileFilterOptions,
  ): Promise<ReadonlyArray<Readonly<RouteProfileInternalDto>>> {
    return this.repository.findProfiles(tenantId, filters)
  }

  async calculateRoute(
    dto: CalculateRouteDto,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<PlannedRouteInternalDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, dto.vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant informado', {
        errorCode: 'FLEET-0007',
      })
    }

    const profile = await this.repository.findProfileById(tenantId, dto.profileId)
    if (!profile) {
      throw new NotFoundException('Perfil de rota não encontrado para o tenant informado', {
        errorCode: 'FLEET-0015',
      })
    }

    const sortedWaypoints: Waypoint[] = [...(dto.waypoints ?? [])].sort(
      (a, b) => a.sequence - b.sequence,
    )

    const points: Array<{ latitude: number; longitude: number }> = [
      dto.origin,
      ...sortedWaypoints,
      dto.destination,
    ]

    let totalDistanceKm = 0
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const segmentDistance = MapUtils.getDistance(
        { lat: p1.latitude, lng: p1.longitude },
        { lat: p2.latitude, lng: p2.longitude },
      )
      totalDistanceKm += segmentDistance
    }

    const distanceKm = Number(totalDistanceKm.toFixed(2))

    const contextConfig = CONTEXT_FACTORS[profile.businessContext]
    const effectiveSpeedKmh = Math.max(
      1,
      Math.min(profile.physicalConstraints.maxSpeedKmh, contextConfig.defaultAvgSpeedKmh),
    )

    const estimatedDurationMinutes = Number(((distanceKm / effectiveSpeedKmh) * 60).toFixed(2))
    const projectedFuelLiters = Number((distanceKm * contextConfig.fuelRateLitersPerKm).toFixed(2))

    let entity: PlannedRouteEntity
    try {
      entity = new PlannedRouteEntity({
        id: crypto.randomUUID(),
        tenantId,
        profileId: profile.id,
        vehicleId: vehicle.id,
        origin: dto.origin,
        destination: dto.destination,
        waypoints: sortedWaypoints,
        distanceKm,
        estimatedDurationMinutes,
        projectedFuelLiters,
        status: 'PLANNED',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(message)
    }

    const saveDto = new SavePlannedRouteInternalDto({
      id: entity.id,
      tenantId: entity.tenantId,
      profileId: entity.profileId,
      vehicleId: entity.vehicleId,
      origin: entity.origin,
      destination: entity.destination,
      waypoints: entity.waypoints,
      distanceKm: entity.distanceKm,
      estimatedDurationMinutes: entity.estimatedDurationMinutes,
      projectedFuelLiters: entity.projectedFuelLiters,
      status: entity.status,
      dispatchedAt: entity.dispatchedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    })

    const savedRoute = await this.repository.createPlannedRoute(saveDto)

    const enrichedRoute = this.enrichRouteWithRelations(savedRoute, vehicle, profile)

    await this.externalService.notifyRouteCalculated(enrichedRoute)

    return enrichedRoute
  }

  async getRouteById(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<PlannedRouteInternalDto>> {
    const route = await this.repository.findRouteById(tenantId, id)
    if (!route) {
      throw new NotFoundException('Rota não encontrada para o tenant informado', {
        errorCode: 'FLEET-0016',
      })
    }

    const [vehicle, profile] = await Promise.all([
      this.vehicleRepository.findById(tenantId, route.vehicleId),
      this.repository.findProfileById(tenantId, route.profileId),
    ])

    return this.enrichRouteWithRelations(route, vehicle ?? undefined, profile ?? undefined)
  }

  async listRoutes(
    tenantId = this.tenantContext.tenantId,
    filters?: RouteFilterOptions,
  ): Promise<ReadonlyArray<Readonly<PlannedRouteInternalDto>>> {
    return this.repository.findRoutes(tenantId, filters)
  }

  async dispatchRoute(
    id: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<PlannedRouteInternalDto>> {
    const route = await this.repository.findRouteById(tenantId, id)
    if (!route) {
      throw new NotFoundException('Rota não encontrada para o tenant informado', {
        errorCode: 'FLEET-0016',
      })
    }

    if (route.status !== 'PLANNED') {
      throw new ConflictException('Rota já foi despachada ou finalizada', {
        errorCode: 'FLEET-0017',
      })
    }

    const updated = await this.repository.updateRouteStatus(tenantId, id, 'DISPATCHED', new Date())

    if (!updated) {
      throw new NotFoundException('Rota não encontrada para o tenant informado', {
        errorCode: 'FLEET-0016',
      })
    }

    const vehicle = await this.vehicleRepository.findById(tenantId, updated.vehicleId)
    const profile = await this.repository.findProfileById(tenantId, updated.profileId)

    const enriched = this.enrichRouteWithRelations(
      updated,
      vehicle ?? undefined,
      profile ?? undefined,
    )

    await this.externalService.notifyRouteDispatched(enriched)

    return enriched
  }

  private enrichRouteWithRelations(
    route: Readonly<PlannedRouteInternalDto>,
    vehicle?: { id: string; plate: string; model?: string },
    profile?: Readonly<RouteProfileInternalDto>,
  ): Readonly<PlannedRouteInternalDto> {
    return new PlannedRouteInternalDto({
      id: route.id,
      tenantId: route.tenantId,
      profileId: route.profileId,
      vehicleId: route.vehicleId,
      origin: route.origin,
      destination: route.destination,
      waypoints: route.waypoints,
      distanceKm: route.distanceKm,
      estimatedDurationMinutes: route.estimatedDurationMinutes,
      projectedFuelLiters: route.projectedFuelLiters,
      status: route.status,
      dispatchedAt: route.dispatchedAt,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      vehicle: vehicle
        ? new RouteVehicleSummaryDto({
            id: vehicle.id,
            plate: vehicle.plate,
            model: vehicle.model,
          })
        : undefined,
      profile: profile ?? undefined,
    })
  }
}

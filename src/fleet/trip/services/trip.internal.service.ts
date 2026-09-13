import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { MapUtils } from '../../../platform/geo/map.utils.js'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import { FinishTripInternalDto } from '../dtos/internal/finish-trip.internal.dto.js'
import { StartTripInternalDto } from '../dtos/internal/start-trip.internal.dto.js'
import {
  TripReportInternalDto,
  TripRoutePointDto,
  TripStatsDto,
} from '../dtos/internal/trip-report.internal.dto.js'
import type { TripInternalDto } from '../dtos/internal/trip.internal.dto.js'
import { TripRepository } from '../repositories/trip.repository.js'
import { TripExternalService } from './trip.external.service.js'

@Injectable()
export class TripInternalService {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly externalService: TripExternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  async startTrip(
    vehicleId: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TripInternalDto>> {
    const vehicle = await this.vehicleRepository.findById(tenantId, vehicleId)
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para o tenant especificado', {
        errorCode: 'FLEET-0007',
      })
    }

    const active = await this.tripRepository.findActiveByVehicle(tenantId, vehicleId)
    if (active) {
      return active
    }

    const trip = await this.tripRepository.create(new StartTripInternalDto({ tenantId, vehicleId }))

    void this.externalService.notifyTripStarted(trip)
    return trip
  }

  async finishTrip(
    tripId: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TripInternalDto>> {
    const trip = await this.tripRepository.findById(tenantId, tripId)
    if (!trip) {
      throw new NotFoundException('Viagem não encontrada', {
        errorCode: 'FLEET-0003',
      })
    }

    if (trip.endedAt) {
      throw new ConflictException('Viagem já foi encerrada anteriormente', {
        errorCode: 'FLEET-0004',
      })
    }

    const points = await this.tripRepository.getTelemetryPoints(tripId)

    let totalDistance = 0
    if (points.length >= 2) {
      for (let i = 0; i < points.length - 1; i++) {
        totalDistance += MapUtils.getDistance(
          { lat: points[i].latitude, lng: points[i].longitude },
          { lat: points[i + 1].latitude, lng: points[i + 1].longitude },
        )
      }
    }

    const distanceKm = Number(totalDistance.toFixed(2))
    const endedAt = new Date().toISOString()

    const updated = await this.tripRepository.finishTrip(
      new FinishTripInternalDto({
        tripId,
        tenantId,
        endedAt,
        distanceKm,
      }),
    )

    void this.externalService.notifyTripFinished(updated)
    return updated
  }

  async findActiveByVehicle(
    tenantId: string,
    vehicleId: string,
  ): Promise<Readonly<TripInternalDto> | null> {
    return this.tripRepository.findActiveByVehicle(tenantId, vehicleId)
  }

  async findById(
    tripId: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TripInternalDto>> {
    const trip = await this.tripRepository.findById(tenantId, tripId)
    if (!trip) {
      throw new NotFoundException('Viagem não encontrada', {
        errorCode: 'FLEET-0003',
      })
    }

    return trip
  }

  async findActiveTrips(
    tenantId = this.tenantContext.tenantId,
  ): Promise<ReadonlyArray<Readonly<TripInternalDto>>> {
    return this.tripRepository.findActiveTrips(tenantId)
  }

  async getTripReport(
    tripId: string,
    tenantId = this.tenantContext.tenantId,
  ): Promise<Readonly<TripReportInternalDto>> {
    const trip = await this.tripRepository.findById(tenantId, tripId)
    if (!trip) {
      throw new NotFoundException('Viagem não encontrada', {
        errorCode: 'FLEET-0003',
      })
    }

    const points = await this.tripRepository.getTelemetryPoints(tripId)

    const route = await Promise.all(
      points.map(async (p) => {
        const address = await this.externalService.resolveAddress(p.latitude, p.longitude)
        return new TripRoutePointDto({
          lat: p.latitude,
          lng: p.longitude,
          speed: p.speed,
          time: p.timestamp,
          address,
        })
      }),
    )

    const avgSpeed =
      points.length > 0
        ? Number((points.reduce((acc, p) => acc + p.speed, 0) / points.length).toFixed(2))
        : 0

    const startAddress = route[0]?.address || 'Início não mapeado'
    const endAddress = route[route.length - 1]?.address || 'Fim não mapeado'

    return new TripReportInternalDto({
      id: trip.id,
      vehiclePlate: trip.vehicle?.plate || 'DESCONHECIDO',
      startAddress,
      endAddress,
      stats: new TripStatsDto({
        distanceKm: trip.distanceKm,
        avgSpeed,
        pointCount: points.length,
      }),
      route,
    })
  }
}

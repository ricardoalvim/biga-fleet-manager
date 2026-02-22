import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Telemetry } from '../telemetry/schemas/telemetry.schema'
import { MapUtils } from '../../shared/utils/map.utils'
import { GeocodingService } from '../../shared/utils/geocoding.service'

@Injectable()
export class TripService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
  ) { }

  async findActiveByChariot(chariotId: string) {
    return this.prisma.trip.findFirst({
      where: { chariotId, endedAt: null }
    })
  }

  async startTrip(chariotId: string) {
    const active = await this.findActiveByChariot(chariotId)
    if (active) return active

    return this.prisma.trip.create({
      data: {
        chariotId,
        isHitched: true,
        startedAt: new Date()
      }
    })
  }

  async finishTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip || trip.endedAt) return trip

    await new Promise(resolve => setTimeout(resolve, 500))
    const points = await this.telemetryModel.find({ tripId }).sort({ timestamp: 1 })

    let totalDistance = 0

    if (points.length >= 2) {
      for (let i = 0; i < points.length - 1; i++) {
        totalDistance += MapUtils.getDistance(
          { lat: points[i].latitude, lng: points[i].longitude },
          { lat: points[i + 1].latitude, lng: points[i + 1].longitude }
        )
      }
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        endedAt: new Date(),
        isHitched: false,
        distanceKm: Number(totalDistance.toFixed(2))
      }
    })
  }

  async getTripReport(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { chariot: true }
    })

    if (!trip) throw new Error('Trip não encontrada')

    const points = await this.telemetryModel.find({ tripId }).sort({ timestamp: 1 }).lean()

    const enrichedRoute = await Promise.all(
      points.map(async (p) => ({
        lat: p.latitude,
        lng: p.longitude,
        speed: p.speed,
        time: p.timestamp,
        address: await this.geocodingService.reverse(p.latitude, p.longitude)
      }))
    )

    const avgSpeed = points.length > 0
      ? points.reduce((acc, p) => acc + p.speed, 0) / points.length
      : 0

    return {
      id: trip.id,
      chariot: trip.chariot.plate,
      startAddress: enrichedRoute[0]?.address || 'Início não mapeado',
      endAddress: enrichedRoute[enrichedRoute.length - 1]?.address || 'Fim não mapeado',
      stats: {
        distanceKm: trip.distanceKm,
        avgSpeed: Number(avgSpeed.toFixed(2)),
        pointCount: points.length
      },
      route: enrichedRoute
    }
  }

  async findActiveTrips() {
    return this.prisma.trip.findMany({
      where: { endedAt: null },
      include: { chariot: true }
    })
  }
}
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Telemetry } from '../telemetry/schemas/telemetry.schema'
import { MapUtils } from '../../shared/utils/map.utils'

@Injectable()
export class TripService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
  ) {}

  async findActiveByChariot(chariotId: string) {
    return this.prisma.trip.findFirst({
      where: { chariotId, endedAt: null },
    })
  }

  async startTrip(chariotId: string) {
    const active = await this.findActiveByChariot(chariotId)
    if (active) return active

    return this.prisma.trip.create({
      data: {
        chariotId,
        isHitched: true,
        startedAt: new Date(),
      },
    })
  }

  async finishTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip || trip.endedAt) return trip

    // Busca o rastro completo para calcular a distância real
    const points = await this.telemetryModel.find({ tripId }).sort({ timestamp: 1 })

    let totalDistance = 0

    if (points.length >= 2) {
      for (let i = 0; i < points.length - 1; i++) {
        totalDistance += MapUtils.getDistance(
          { lat: points[i].latitude, lng: points[i].longitude },
          { lat: points[i + 1].latitude, lng: points[i + 1].longitude },
        )
      }
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        endedAt: new Date(),
        isHitched: false,
        distanceKm: Number(totalDistance.toFixed(2)),
      },
    })
  }

  async findActiveTrips() {
    return this.prisma.trip.findMany({
      where: { endedAt: null },
      include: { chariot: true },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Telemetry } from '../telemetry/schemas/telemetry.schema'
import { DateUtils } from '../../shared/utils/date.utils'

@Injectable()
export class FleetOverviewService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>
    ) { }

    async getDashboardStats() {
        const today = DateUtils.getStartOfToday()

        const [fleetStats, activeTrips, telemetryCount] = await Promise.all([
            this.prisma.trip.aggregate({
                where: { startedAt: { gte: today } },
                _sum: { distanceKm: true },
                _count: { id: true }
            }),

            this.prisma.trip.count({
                where: { endedAt: null }
            }),

            this.telemetryModel.estimatedDocumentCount()
        ])

        return {
            fleetStatus: {
                activeChariots: activeTrips,
                totalTripsToday: fleetStats._count.id,
                totalDistanceTodayKm: Number(fleetStats._sum.distanceKm?.toFixed(2) || 0)
            },
            infrastructure: {
                totalTelemetryPoints: telemetryCount,
                storageType: 'Hybrid (PostgreSQL + MongoDB)',
                caching: 'Redis Enabled (Geocoding)'
            }
        }
    }
}
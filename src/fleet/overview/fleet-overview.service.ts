import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DateUtils } from '../../platform/geo/date.utils.js'
import { PrismaService } from '../../platform/persistence/prisma.service.js'
import { TenantContext } from '../../tenancy/tenant.context.js'
import { Telemetry } from '../../telemetry/telemetry.document.js'

@Injectable()
export class FleetOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<Telemetry>,
  ) {}

  async getDashboardStats() {
    const tenantId = this.tenant.tenantId
    const today = DateUtils.getStartOfToday().toISOString()

    const [fleetStats, active, telemetryCount] = await Promise.all([
      this.prisma.orm.Trip.where({ tenantId })
        .where((trip) => trip.startedAt.gte(today))
        .aggregate((agg) => ({
          totalDistance: agg.sum('distanceKm'),
          total: agg.count(),
        })),
      this.prisma.orm.Trip.where({ tenantId, endedAt: null }).aggregate((agg) => ({
        total: agg.count(),
      })),
      this.telemetryModel.countDocuments({ tenantId }),
    ])

    return {
      fleetStatus: {
        activeVehicles: active.total,
        totalTripsToday: fleetStats.total,
        totalDistanceTodayKm: Number((fleetStats.totalDistance ?? 0).toFixed(2)),
      },
      infrastructure: {
        totalTelemetryPoints: telemetryCount,
        storageType: 'Hybrid (PostgreSQL + MongoDB)',
        caching: 'Redis Enabled (Geocoding)',
      },
    }
  }
}

import { Injectable } from '@nestjs/common'
import { TripInternalService } from './services/trip.internal.service.js'

/**
 * Bridge service for backward compatibility.
 * Delegates all operations to TripInternalService.
 */
@Injectable()
export class TripService {
  constructor(private readonly internalService: TripInternalService) {}

  findActiveByVehicle(tenantId: string, vehicleId: string) {
    return this.internalService.findActiveByVehicle(tenantId, vehicleId)
  }

  startTrip(vehicleId: string, tenantId?: string) {
    return this.internalService.startTrip(vehicleId, tenantId)
  }

  finishTrip(tripId: string, tenantId?: string) {
    return this.internalService.finishTrip(tripId, tenantId)
  }

  getTripReport(tripId: string) {
    return this.internalService.getTripReport(tripId)
  }

  findActiveTrips() {
    return this.internalService.findActiveTrips()
  }

  findById(tripId: string) {
    return this.internalService.findById(tripId)
  }
}

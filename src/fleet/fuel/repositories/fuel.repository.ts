import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  FuelAuditRecordDocument,
  type FuelStatus,
} from '../schemas/fuel-audit-record.document.js'
import { FuelAuditRecordEntity } from '../entities/fuel-audit-record.entity.js'
import {
  FuelAuditInternalDto,
  type FuelAuditMetricsInternalDto,
} from '../dtos/internal/fuel-audit.internal.dto.js'

export interface FuelAuditFilterOptions {
  readonly vehicleId?: string
  readonly plate?: string
  readonly status?: FuelStatus
  readonly driverId?: string
  readonly startDate?: string
  readonly endDate?: string
  readonly minScore?: number
}

interface RawFuelAuditRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly vehicleId: string
  readonly driverId?: string
  readonly plate: string
  readonly gasStation: {
    readonly name: string
    readonly cnpj?: string
    readonly latitude: number
    readonly longitude: number
    readonly address?: string
  }
  readonly timestamp: Date
  readonly fuelType: string
  readonly liters: number
  readonly pricePerLiter: number
  readonly totalValue: number
  readonly reportedOdometerKm: number
  readonly status: FuelStatus
  readonly fraudRiskScore: number
  readonly fraudSignals: ReadonlyArray<string>
  readonly mitigatingFactors: ReadonlyArray<string>
  readonly reconciledAt: Date
  readonly notes?: string
}

@Injectable()
export class FuelRepository {
  constructor(
    @InjectModel('FuelAuditRecordModel')
    private readonly auditModel: Model<FuelAuditRecordDocument>,
  ) {}

  async create(record: FuelAuditRecordEntity): Promise<Readonly<FuelAuditInternalDto>> {
    const created = await this.auditModel.create({
      tenantId: record.tenantId,
      vehicleId: record.vehicleId,
      driverId: record.driverId,
      plate: record.plate,
      gasStation: {
        name: record.gasStation.name,
        cnpj: record.gasStation.cnpj,
        latitude: record.gasStation.latitude,
        longitude: record.gasStation.longitude,
        address: record.gasStation.address,
      },
      timestamp: record.timestamp,
      fuelType: record.fuelType,
      liters: record.liters,
      pricePerLiter: record.pricePerLiter,
      totalValue: record.totalValue,
      reportedOdometerKm: record.reportedOdometerKm,
      status: record.status,
      fraudRiskScore: record.fraudRiskScore,
      fraudSignals: [...record.fraudSignals],
      mitigatingFactors: [...record.mitigatingFactors],
      reconciledAt: record.reconciledAt,
      notes: record.notes,
    })

    return this.mapToDto(created.toObject() as unknown as RawFuelAuditRecord)
  }

  async findAuditById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<FuelAuditInternalDto> | null> {
    const doc = await this.auditModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapToDto(doc as unknown as RawFuelAuditRecord) : null
  }

  async findAudits(
    tenantId: string,
    filters?: FuelAuditFilterOptions,
  ): Promise<ReadonlyArray<Readonly<FuelAuditInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }

    if (filters?.vehicleId) query.vehicleId = filters.vehicleId
    if (filters?.plate) query.plate = filters.plate.toUpperCase().trim()
    if (filters?.status) query.status = filters.status
    if (filters?.driverId) query.driverId = filters.driverId
    if (filters?.minScore !== undefined) query.fraudRiskScore = { $gte: filters.minScore }

    if (filters?.startDate || filters?.endDate) {
      const dateRange: Record<string, Date> = {}
      if (filters.startDate) dateRange.$gte = new Date(filters.startDate)
      if (filters.endDate) dateRange.$lte = new Date(filters.endDate)
      query.timestamp = dateRange
    }

    const docs = await this.auditModel.find(query).sort({ timestamp: -1 }).limit(200).lean()

    return Object.freeze(docs.map((d) => this.mapToDto(d as unknown as RawFuelAuditRecord)))
  }

  async getMetrics(tenantId: string): Promise<Readonly<FuelAuditMetricsInternalDto>> {
    const records = await this.auditModel.find({ tenantId }).lean()

    let approved = 0
    let suspect = 0
    let rejected = 0
    let totalSpent = 0
    let totalLiters = 0
    let suspectAmount = 0
    const signalFrequency = new Map<string, number>()

    for (const r of records) {
      totalSpent += r.totalValue || 0
      totalLiters += r.liters || 0

      if (r.status === 'APPROVED') approved++
      else if (r.status === 'SUSPECT') {
        suspect++
        suspectAmount += r.totalValue || 0
      } else if (r.status === 'REJECTED') {
        rejected++
        suspectAmount += r.totalValue || 0
      }

      for (const sig of r.fraudSignals || []) {
        signalFrequency.set(sig, (signalFrequency.get(sig) ?? 0) + 1)
      }
    }

    const commonSignals = Array.from(signalFrequency.entries())
      .map(([signal, count]) => ({ signal, count }))
      .sort((a, b) => b.count - a.count)

    return Object.freeze({
      tenantId,
      totalReconciled: records.length,
      approvedCount: approved,
      suspectCount: suspect,
      rejectedCount: rejected,
      totalAmountSpent: Math.round(totalSpent * 100) / 100,
      totalLitersSupplied: Math.round(totalLiters * 100) / 100,
      totalSuspectAmount: Math.round(suspectAmount * 100) / 100,
      commonFraudSignals: Object.freeze(commonSignals),
    })
  }

  private mapToDto(raw: RawFuelAuditRecord): Readonly<FuelAuditInternalDto> {
    return new FuelAuditInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      vehicleId: raw.vehicleId,
      driverId: raw.driverId,
      plate: raw.plate,
      gasStation: {
        name: raw.gasStation.name,
        cnpj: raw.gasStation.cnpj,
        latitude: raw.gasStation.latitude,
        longitude: raw.gasStation.longitude,
        address: raw.gasStation.address,
      },
      timestamp: raw.timestamp instanceof Date ? raw.timestamp.toISOString() : String(raw.timestamp),
      fuelType: raw.fuelType as any,
      liters: raw.liters,
      pricePerLiter: raw.pricePerLiter,
      totalValue: raw.totalValue,
      reportedOdometerKm: raw.reportedOdometerKm,
      status: raw.status,
      fraudRiskScore: raw.fraudRiskScore,
      fraudSignals: raw.fraudSignals || [],
      mitigatingFactors: raw.mitigatingFactors || [],
      reconciledAt:
        raw.reconciledAt instanceof Date
          ? raw.reconciledAt.toISOString()
          : String(raw.reconciledAt || new Date()),
      notes: raw.notes,
    })
  }
}


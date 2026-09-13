import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { TollEventDocument } from '../schemas/toll-event.document.js'
import { IncidentDocument } from '../schemas/incident.document.js'
import { TollEventInternalDto } from '../dtos/internal/toll-event.internal.dto.js'
import type { CreateTollEventInternalDto } from '../dtos/internal/create-toll-event.internal.dto.js'
import { IncidentInternalDto } from '../dtos/internal/incident.internal.dto.js'
import type { CreateIncidentInternalDto } from '../dtos/internal/create-incident.internal.dto.js'
import type { SettleIncidentInternalDto } from '../dtos/internal/settle-incident.internal.dto.js'

export interface TollFilterOptions {
  readonly vehicleId?: string
}

export interface IncidentFilterOptions {
  readonly vehicleId?: string
  readonly responsibleCompanyId?: string
  readonly incidentType?: string
  readonly status?: string
}

interface RawTollRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly vehicleId: string
  readonly tollPlazaName: string
  readonly externalTransactionId: string
  readonly amount: number
  readonly passedAt: Date
  readonly createdAt: Date
}

interface RawIncidentRecord {
  readonly _id: unknown
  readonly tenantId: string
  readonly vehicleId: string
  readonly responsibleCompanyId: string
  readonly incidentType: 'ACCIDENT' | 'FINE' | 'DAMAGE' | 'THEFT' | 'OTHER'
  readonly description: string
  readonly estimatedCost: number
  readonly actualCost?: number | null
  readonly status: 'OPEN' | 'IN_REVIEW' | 'SETTLED' | 'CANCELLED'
  readonly occurredAt: Date
  readonly settledAt?: Date | null
  readonly createdAt: Date
}

@Injectable()
export class IncidentTollRepository {
  constructor(
    @InjectModel(TollEventDocument.name)
    private readonly tollModel: Model<TollEventDocument>,
    @InjectModel(IncidentDocument.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) {}

  async createTollEvent(
    dto: Readonly<CreateTollEventInternalDto>,
  ): Promise<Readonly<TollEventInternalDto>> {
    const doc = await this.tollModel.create({
      tenantId: dto.tenantId,
      vehicleId: dto.vehicleId,
      tollPlazaName: dto.tollPlazaName,
      externalTransactionId: dto.externalTransactionId,
      amount: dto.amount,
      passedAt: new Date(dto.passedAt),
    })

    return this.mapTollToDto(doc.toObject())
  }

  async findTollByExternalId(
    tenantId: string,
    externalTransactionId: string,
  ): Promise<Readonly<TollEventInternalDto> | null> {
    const doc = await this.tollModel.findOne({ tenantId, externalTransactionId }).lean()

    return doc ? this.mapTollToDto(doc) : null
  }

  async findTolls(
    tenantId: string,
    filters?: TollFilterOptions,
  ): Promise<ReadonlyArray<Readonly<TollEventInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.vehicleId) query.vehicleId = filters.vehicleId

    const docs = await this.tollModel.find(query).sort({ passedAt: -1 }).lean()

    return Object.freeze(docs.map((d) => this.mapTollToDto(d as unknown as RawTollRecord)))
  }

  async createIncident(
    dto: Readonly<CreateIncidentInternalDto>,
  ): Promise<Readonly<IncidentInternalDto>> {
    const doc = await this.incidentModel.create({
      tenantId: dto.tenantId,
      vehicleId: dto.vehicleId,
      responsibleCompanyId: dto.responsibleCompanyId,
      incidentType: dto.incidentType,
      description: dto.description,
      estimatedCost: dto.estimatedCost,
      actualCost: null,
      status: 'OPEN',
      occurredAt: new Date(dto.occurredAt),
      settledAt: null,
    })

    return this.mapIncidentToDto(doc.toObject())
  }

  async findIncidentById(
    tenantId: string,
    id: string,
  ): Promise<Readonly<IncidentInternalDto> | null> {
    const doc = await this.incidentModel.findOne({ _id: id, tenantId }).lean()
    return doc ? this.mapIncidentToDto(doc) : null
  }

  async findIncidents(
    tenantId: string,
    filters?: IncidentFilterOptions,
  ): Promise<ReadonlyArray<Readonly<IncidentInternalDto>>> {
    const query: Record<string, unknown> = { tenantId }
    if (filters?.vehicleId) query.vehicleId = filters.vehicleId
    if (filters?.responsibleCompanyId) query.responsibleCompanyId = filters.responsibleCompanyId
    if (filters?.incidentType) query.incidentType = filters.incidentType
    if (filters?.status) query.status = filters.status

    const docs = await this.incidentModel.find(query).sort({ occurredAt: -1 }).lean()

    return Object.freeze(docs.map((d) => this.mapIncidentToDto(d as unknown as RawIncidentRecord)))
  }

  async settleIncident(
    dto: Readonly<SettleIncidentInternalDto>,
  ): Promise<Readonly<IncidentInternalDto> | null> {
    const updated = await this.incidentModel
      .findOneAndUpdate(
        { _id: dto.incidentId, tenantId: dto.tenantId },
        {
          $set: {
            status: 'SETTLED',
            actualCost: dto.actualCost,
            settledAt: dto.settledAt ? new Date(dto.settledAt) : new Date(),
          },
        },
        { new: true },
      )
      .lean()

    return updated ? this.mapIncidentToDto(updated) : null
  }

  async getVehicleTollsSum(
    tenantId: string,
    vehicleId: string,
  ): Promise<{ readonly totalAmount: number; readonly count: number }> {
    const docs = await this.tollModel.find({ tenantId, vehicleId }).select('amount').lean()
    const totalAmount = Number(docs.reduce((acc, d) => acc + (d.amount || 0), 0).toFixed(2))

    return { totalAmount, count: docs.length }
  }

  async getVehicleIncidentsSum(
    tenantId: string,
    vehicleId: string,
  ): Promise<{
    readonly totalEstimated: number
    readonly totalActual: number
    readonly count: number
  }> {
    const docs = await this.incidentModel
      .find({ tenantId, vehicleId })
      .select('estimatedCost actualCost status')
      .lean()

    let totalEstimated = 0
    let totalActual = 0

    for (const d of docs) {
      totalEstimated += d.estimatedCost || 0
      if (d.status === 'SETTLED' && d.actualCost !== undefined && d.actualCost !== null) {
        totalActual += d.actualCost
      } else {
        totalActual += d.estimatedCost || 0
      }
    }

    return {
      totalEstimated: Number(totalEstimated.toFixed(2)),
      totalActual: Number(totalActual.toFixed(2)),
      count: docs.length,
    }
  }

  private mapTollToDto(raw: RawTollRecord): Readonly<TollEventInternalDto> {
    return new TollEventInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      vehicleId: raw.vehicleId,
      tollPlazaName: raw.tollPlazaName,
      externalTransactionId: raw.externalTransactionId,
      amount: raw.amount,
      passedAt: raw.passedAt instanceof Date ? raw.passedAt.toISOString() : String(raw.passedAt),
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    })
  }

  private mapIncidentToDto(raw: RawIncidentRecord): Readonly<IncidentInternalDto> {
    return new IncidentInternalDto({
      id: String(raw._id),
      tenantId: raw.tenantId,
      vehicleId: raw.vehicleId,
      responsibleCompanyId: raw.responsibleCompanyId,
      incidentType: raw.incidentType,
      description: raw.description,
      estimatedCost: raw.estimatedCost,
      actualCost: raw.actualCost,
      status: raw.status,
      occurredAt:
        raw.occurredAt instanceof Date ? raw.occurredAt.toISOString() : String(raw.occurredAt),
      settledAt: raw.settledAt
        ? raw.settledAt instanceof Date
          ? raw.settledAt.toISOString()
          : String(raw.settledAt)
        : null,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
    })
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { VehicleRepository } from '../../vehicle/repositories/vehicle.repository.js'
import { MaintenanceRepository } from '../../maintenance/repositories/maintenance.repository.js'
import { Telemetry } from '../../../telemetry/telemetry.document.js'
import { FuelRepository, type FuelAuditFilterOptions } from '../repositories/fuel.repository.js'
import { FuelExternalService } from './fuel.external.service.js'
import { FuelAuditRecordEntity, type FuelAuditStatus } from '../entities/fuel-audit-record.entity.js'
import { FuelAuditInternalDto, type FuelAuditMetricsInternalDto } from '../dtos/internal/fuel-audit.internal.dto.js'
import type { ReconcileFuelTransactionDto, BatchReconcileFuelTransactionsDto } from '../dtos/external/reconcile-fuel-transaction.dto.js'
import { CanonicalFuelMapper } from '../mappers/canonical-fuel-mapper.js'

@Injectable()
export class FuelInternalService {
  private readonly logger = new Logger(FuelInternalService.name)

  constructor(
    private readonly fuelRepo: FuelRepository,
    private readonly fuelExternal: FuelExternalService,
    private readonly vehicleRepo: VehicleRepository,
    private readonly maintenanceRepo: MaintenanceRepository,
    private readonly tenantContext: TenantContext,
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<Telemetry>,
  ) {}

  /**
   * Reconcilia uma transação individual de combustível aplicando as 5 regras antifraude
   */
  async reconcileTransaction(
    dto: ReconcileFuelTransactionDto,
  ): Promise<Readonly<FuelAuditInternalDto>> {
    let tenantId = dto.tenantId
    if (!tenantId) {
      try {
        tenantId = this.tenantContext.tenantId
      } catch {
        tenantId = '00000000-0000-4000-8000-000000000001'
      }
    }

    const plate = dto.plate.toUpperCase().trim()
    const vehicle = await this.vehicleRepo.findByPlate(tenantId, plate)
    const vehicleId = vehicle ? vehicle.id : dto.vehicleId

    // 1. Validação de Capacidade de Tanque
    const tankCapacity = this.resolveTankCapacityLiters(vehicle?.model)
    const fraudSignals: string[] = []
    const mitigatingFactors: string[] = []
    let riskScore = 0

    // Se litragem > capacidade física + 5% de tolerância de gargalo
    if (dto.liters > tankCapacity * 1.05) {
      fraudSignals.push('SIGNAL_TANK_CAPACITY_EXCEEDED')
      riskScore += 45
    }

    // 2. Validação Geográfica & Fator Sombra / Atraso de GPS
    const txTime = new Date(dto.timestamp)
    const lastTelemetry = await this.findNearestTelemetry(tenantId, vehicleId, txTime)

    if (lastTelemetry) {
      const distanceKm = this.calculateHaversineDistanceKm(
        lastTelemetry.latitude,
        lastTelemetry.longitude,
        dto.gasStation.latitude,
        dto.gasStation.longitude,
      )

      const timeDeltaMinutes = Math.abs(txTime.getTime() - lastTelemetry.timestamp.getTime()) / (1000 * 60)

      // Se a última posição registrada está a mais de 2.5 km do posto
      if (distanceKm > 2.5) {
        if (timeDeltaMinutes > 30) {
          // Mais de 30 minutos sem sinal (ex: túnel, serra, galpão fechado ou atraso de transmissão)
          mitigatingFactors.push('GPS_SHADOW_OR_DELAY_BUFFER')
          fraudSignals.push('SIGNAL_POTENTIAL_LOCATION_MISMATCH')
          riskScore += 15
        } else {
          // Veículo transmitiu a minutos de distância, mas longe do posto
          fraudSignals.push('SIGNAL_LOCATION_MISMATCH')
          riskScore += 50
        }
      }
    }

    // 3. Validação de Odômetro e Desvio de Consumo
    const previousAudit = (await this.fuelRepo.findAudits(tenantId, { plate }))[0]
    if (previousAudit) {
      const prevOdo = previousAudit.reportedOdometerKm
      if (dto.reportedOdometerKm < prevOdo) {
        fraudSignals.push('SIGNAL_ODOMETER_REGRESSION')
        riskScore += 40
      } else {
        const deltaKm = dto.reportedOdometerKm - prevOdo
        if (deltaKm > 0 && dto.liters > 0) {
          const kmPerLiter = deltaKm / dto.liters
          // Consumo absurdo (< 0.8 km/l para caminhão ou > 30 km/l para carro leve)
          if (kmPerLiter < 0.8 || kmPerLiter > 32) {
            fraudSignals.push('SIGNAL_SUSPECT_CONSUMPTION')
            riskScore += 25
          }
        }
      }
    }

    // 4. Contexto de Manutenção / Ordem de Serviço Ativa (Fator Atenuante)
    try {
      const activeOrders = await this.maintenanceRepo.findOrders(tenantId, {
        vehicleId,
        status: 'IN_PROGRESS',
      })
      if (activeOrders.length > 0) {
        mitigatingFactors.push('WORKSHOP_GEO_FENCE_OR_ACTIVE_OS')
        riskScore = Math.max(0, riskScore - 25)
      }
    } catch {
      // Degradação graciosa
    }

    // 5. Associação com o Condutor
    if (dto.driverId && dto.driverId.includes('TERCEIRO')) {
      fraudSignals.push('SIGNAL_UNAUTHORIZED_DRIVER')
      riskScore += 20
    }

    const finalScore = Math.min(100, Math.max(0, riskScore))
    let status: FuelAuditStatus = 'APPROVED'
    if (finalScore >= 70) {
      status = 'REJECTED'
    } else if (finalScore >= 35) {
      status = 'SUSPECT'
    }

    const entity = new FuelAuditRecordEntity({
      id: crypto.randomUUID(),
      tenantId,
      vehicleId,
      driverId: dto.driverId,
      plate,
      gasStation: dto.gasStation,
      timestamp: txTime,
      fuelType: dto.fuelType,
      liters: dto.liters,
      pricePerLiter: dto.pricePerLiter,
      totalValue: dto.totalValue,
      reportedOdometerKm: dto.reportedOdometerKm,
      status,
      fraudRiskScore: finalScore,
      fraudSignals,
      mitigatingFactors,
      reconciledAt: new Date(),
      notes: dto.notes,
    })

    const record = await this.fuelRepo.create(entity)

    // Notificações e Eventos Assíncronos no Redis
    await this.fuelExternal.broadcastReconciliation(record)
    if (record.status !== 'APPROVED') {
      await this.fuelExternal.broadcastFraudAlert(record)
    }

    return record
  }

  /**
   * Reconcilia um lote de transações (Batch Ingestion)
   */
  async reconcileBatch(
    dto: BatchReconcileFuelTransactionsDto,
  ): Promise<ReadonlyArray<Readonly<FuelAuditInternalDto>>> {
    const results: FuelAuditInternalDto[] = []
    for (const tx of dto.transactions) {
      const reconciled = await this.reconcileTransaction({
        ...tx,
        tenantId: dto.tenantId ?? tx.tenantId,
      })
      results.push(reconciled)
    }
    return Object.freeze(results)
  }

  /**
   * Processa arquivo legado delimitado (TXT / CSV) e executa reconciliação completa
   */
  async ingestLegacyFile(
    fileContent: string,
    defaultTenantId?: string,
  ): Promise<ReadonlyArray<Readonly<FuelAuditInternalDto>>> {
    const parsed = CanonicalFuelMapper.parseDelimitedContent(fileContent, defaultTenantId)
    return this.reconcileBatch({
      tenantId: defaultTenantId,
      operator: 'CUSTOM',
      transactions: parsed,
    })
  }

  async findAuditById(tenantId: string, id: string): Promise<Readonly<FuelAuditInternalDto>> {
    const audit = await this.fuelRepo.findAuditById(tenantId, id)
    if (!audit) {
      throw new NotFoundException(`Auditoria de combustível não encontrada para o ID ${id}`)
    }
    return audit
  }

  async listAudits(
    tenantId: string,
    filters?: FuelAuditFilterOptions,
  ): Promise<ReadonlyArray<Readonly<FuelAuditInternalDto>>> {
    return this.fuelRepo.findAudits(tenantId, filters)
  }

  async getMetrics(tenantId: string): Promise<Readonly<FuelAuditMetricsInternalDto>> {
    return this.fuelRepo.getMetrics(tenantId)
  }

  private resolveTankCapacityLiters(modelName?: string): number {
    if (!modelName) return 150 // Padrão intermediário

    const lower = modelName.toLowerCase()
    if (lower.includes('truck') || lower.includes('scania') || lower.includes('volvo') || lower.includes('mercedes') || lower.includes('actros') || lower.includes('constellation')) {
      return 450 // Caminhões pesados
    }
    if (lower.includes('van') || lower.includes('sprinter') || lower.includes('ducato') || lower.includes('iveco') || lower.includes('daily')) {
      return 90 // Furgões e utilitários
    }
    if (lower.includes('mobi') || lower.includes('gol') || lower.includes('hb20') || lower.includes('onix') || lower.includes('strada')) {
      return 55 // Veículos leves
    }
    return 150
  }

  private calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  private async findNearestTelemetry(
    tenantId: string,
    vehicleId: string,
    targetDate: Date,
  ): Promise<{ latitude: number; longitude: number; timestamp: Date } | null> {
    try {
      const doc = await this.telemetryModel
        .findOne({
          tenantId,
          vehicleId,
        })
        .sort({ timestamp: -1 })
        .lean()

      if (!doc) return null
      return {
        latitude: doc.latitude,
        longitude: doc.longitude,
        timestamp: doc.timestamp instanceof Date ? doc.timestamp : new Date(doc.timestamp),
      }
    } catch {
      return null
    }
  }
}


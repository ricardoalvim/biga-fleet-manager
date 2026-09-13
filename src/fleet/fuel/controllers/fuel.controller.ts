import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { TenantContext } from '../../../tenancy/tenant.context.js'
import { FuelInternalService } from '../services/fuel.internal.service.js'
import {
  reconcileFuelTransactionSchema,
  batchReconcileFuelTransactionsSchema,
  ingestLegacyFuelFileSchema,
  type ReconcileFuelTransactionDto,
  type BatchReconcileFuelTransactionsDto,
  type IngestLegacyFuelFileDto,
} from '../dtos/external/reconcile-fuel-transaction.dto.js'

@ApiTags('Fuel & Anti-Fraud Reconciliation')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'UUID do Tenant para isolamento estrito de auditorias de combustível',
})
@Controller('api/v1/fuel')
export class FuelController {
  constructor(
    private readonly fuelService: FuelInternalService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reconcilia uma transação de combustível contra telemetria, odômetro e regras antifraude',
  })
  @ApiResponse({
    status: 200,
    description: 'Auditoria processada com score de risco, sinais detectados e status de aprovação',
  })
  async reconcile(
    @Body({ schema: reconcileFuelTransactionSchema }) dto: ReconcileFuelTransactionDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = dto.tenantId ?? headerTenantId ?? this.resolveTenantId()
    return this.fuelService.reconcileTransaction({
      ...dto,
      tenantId,
    })
  }

  @Post('reconcile/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processa e reconcilia um lote de transações financeiras de combustível (Modern Gateway)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de auditoria processados',
  })
  async reconcileBatch(
    @Body({ schema: batchReconcileFuelTransactionsSchema }) dto: BatchReconcileFuelTransactionsDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = dto.tenantId ?? headerTenantId ?? this.resolveTenantId()
    return this.fuelService.reconcileBatch({
      ...dto,
      tenantId,
    })
  }

  @Post('reconcile/legacy-file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ingere e processa arquivo delimitado legado (TXT / CSV) de operadoras (Ticket Log, ValeCard)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transações extraídas e reconciliadas em lote',
  })
  async ingestLegacyFile(
    @Body({ schema: ingestLegacyFuelFileSchema }) dto: IngestLegacyFuelFileDto,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = dto.tenantId ?? headerTenantId ?? this.resolveTenantId()
    return this.fuelService.ingestLegacyFile(dto.content, tenantId)
  }

  @Get('audits')
  @ApiOperation({
    summary: 'Lista histórico de auditorias de combustível com filtros por placa, status ou período',
  })
  @ApiQuery({ name: 'plate', required: false, description: 'Filtrar por placa' })
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Filtrar por ID do veículo' })
  @ApiQuery({ name: 'status', required: false, enum: ['APPROVED', 'SUSPECT', 'REJECTED'] })
  @ApiQuery({ name: 'minScore', required: false, description: 'Score mínimo de risco' })
  @ApiResponse({
    status: 200,
    description: 'Lista de auditorias conciliadas',
  })
  async listAudits(
    @Query('plate') plate?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: 'APPROVED' | 'SUSPECT' | 'REJECTED',
    @Query('minScore') minScore?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = headerTenantId ?? this.resolveTenantId()
    return this.fuelService.listAudits(tenantId, {
      plate,
      vehicleId,
      status,
      minScore: minScore ? Number(minScore) : undefined,
    })
  }

  @Get('audits/:id')
  @ApiOperation({
    summary: 'Busca detalhes de uma auditoria de combustível por ID',
  })
  @ApiParam({ name: 'id', description: 'ID da auditoria' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da auditoria com dados de posto e sinais de fraude',
  })
  async getAuditById(
    @Param('id') id: string,
    @Headers('x-tenant-id') headerTenantId?: string,
  ) {
    const tenantId = headerTenantId ?? this.resolveTenantId()
    return this.fuelService.findAuditById(tenantId, id)
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Retorna métricas consolidadas de consumo, gastos e detecção de fraudes de combustível',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicadores agregados de combustível do tenant',
  })
  async getMetrics(@Headers('x-tenant-id') headerTenantId?: string) {
    const tenantId = headerTenantId ?? this.resolveTenantId()
    return this.fuelService.getMetrics(tenantId)
  }

  private resolveTenantId(): string {
    try {
      return this.tenantContext.tenantId
    } catch {
      return '00000000-0000-4000-8000-000000000001'
    }
  }
}


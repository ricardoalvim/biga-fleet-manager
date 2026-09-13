import { BadRequestException } from '@nestjs/common'
import type {
  FuelAuditType,
} from '../entities/fuel-audit-record.entity.js'
import type { ReconcileFuelTransactionDto } from '../dtos/external/reconcile-fuel-transaction.dto.js'

export class CanonicalFuelMapper {
  /**
   * Converte arquivos delimitados legados (CSV / TXT) de operadoras de combustível
   * (Ticket Log, ValeCard, Good Card) em DTOs canônicos normalizados.
   *
   * Formato padrão aceito de linha delimitada por ';' ou ',':
   * PLATE;TIMESTAMP;STATION_NAME;LAT;LON;FUEL_TYPE;LITERS;PRICE_LITER;TOTAL_VAL;ODOMETER;[DRIVER_ID];[CNPJ]
   */
  static parseDelimitedContent(
    content: string,
    defaultTenantId?: string,
  ): ReconcileFuelTransactionDto[] {
    if (!content || !content.trim()) {
      throw new BadRequestException('Conteúdo do arquivo de combustível está vazio')
    }

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) {
      throw new BadRequestException('Nenhuma linha válida encontrada no arquivo')
    }

    const results: ReconcileFuelTransactionDto[] = []

    // Detecta se a primeira linha é cabeçalho
    const firstLine = lines[0].toUpperCase()
    const startIndex =
      firstLine.includes('PLATE') ||
      firstLine.includes('PLACA') ||
      firstLine.includes('VEICULO') ||
      firstLine.includes('DATA')
        ? 1
        : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('#') || line.startsWith('//')) continue

      const separator = line.includes(';') ? ';' : ','
      const cols = line.split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ''))

      if (cols.length < 9) {
        // Linha incompleta ignorada ou lançada se for a única
        if (lines.length === 1) {
          throw new BadRequestException(
            `Linha ${i + 1} inválida: esperado no mínimo 9 colunas, recebido ${cols.length}`,
          )
        }
        continue
      }

      const plate = cols[0].toUpperCase().replace(/[^A-Z0-9]/g, '')
      const timestampRaw = cols[1]
      const stationName = cols[2]
      const lat = parseFloat(cols[3].replace(',', '.'))
      const lon = parseFloat(cols[4].replace(',', '.'))
      const fuelTypeRaw = cols[5].toUpperCase()
      const liters = parseFloat(cols[6].replace(',', '.'))
      const pricePerLiter = parseFloat(cols[7].replace(',', '.'))
      const totalValue = parseFloat(cols[8].replace(',', '.'))
      const odometer = cols[9] ? parseFloat(cols[9].replace(',', '.')) : 0
      const driverId = cols[10] || undefined
      const cnpj = cols[11] || undefined

      if (isNaN(lat) || isNaN(lon) || isNaN(liters) || isNaN(pricePerLiter) || isNaN(totalValue)) {
        continue
      }

      results.push({
        tenantId: defaultTenantId,
        vehicleId: plate, // Inicialmente atribuído à placa, mapeado depois
        plate,
        driverId,
        gasStation: {
          name: stationName || 'Posto Credenciado',
          cnpj,
          latitude: lat,
          longitude: lon,
        },
        timestamp: this.normalizeTimestamp(timestampRaw),
        fuelType: this.mapFuelType(fuelTypeRaw),
        liters: Math.abs(liters),
        pricePerLiter: Math.abs(pricePerLiter),
        totalValue: Math.abs(totalValue),
        reportedOdometerKm: Math.max(0, odometer),
        notes: `Importado via Canonical Gateway (${separator === ';' ? 'CSV-BR' : 'CSV-STD'})`,
      })
    }

    if (results.length === 0) {
      throw new BadRequestException('Nenhuma transação válida pôde ser extraída do arquivo')
    }

    return results
  }

  private static mapFuelType(raw: string): FuelAuditType {
    const norm = raw.toUpperCase()
    if (norm.includes('S10') || norm.includes('DIESEL 10')) return 'DIESEL_S10'
    if (norm.includes('S500') || norm.includes('DIESEL')) return 'DIESEL_S500'
    if (norm.includes('ETANOL') || norm.includes('ALCOOL') || norm.includes('ETHANOL'))
      return 'ETHANOL'
    if (norm.includes('GNV') || norm.includes('CNG')) return 'CNG'
    if (norm.includes('ARLA')) return 'ARLA32'
    return 'GASOLINE'
  }

  private static normalizeTimestamp(raw: string): string {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      return d.toISOString()
    }
    // Suporte ao formato brasileiro DD/MM/YYYY HH:mm:ss
    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
    if (brMatch) {
      const [, day, month, year, h = '00', m = '00', s = '00'] = brMatch
      return new Date(`${year}-${month}-${day}T${h}:${m}:${s}Z`).toISOString()
    }
    return new Date().toISOString()
  }
}


import { describe, expect, it } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import { CanonicalFuelMapper } from './canonical-fuel-mapper.js'

describe('CanonicalFuelMapper', () => {
  it('deve converter conteúdo CSV com cabeçalho no padrão ponto-e-vírgula', () => {
    const csvContent = `PLACA;DATA;POSTO;LAT;LON;COMBUSTIVEL;LITROS;PRECO_LITRO;VALOR_TOTAL;ODOMETRO;MOTORISTA
ABC1234;2026-09-13T10:00:00Z;Posto Ipiranga Centro;-23.5505;-46.6333;DIESEL_S10;120.5;6.19;745.895;154200;MOT-001`

    const res = CanonicalFuelMapper.parseDelimitedContent(csvContent, '00000000-0000-4000-8000-000000000001')

    expect(res).toHaveLength(1)
    expect(res[0].plate).toBe('ABC1234')
    expect(res[0].fuelType).toBe('DIESEL_S10')
    expect(res[0].liters).toBe(120.5)
    expect(res[0].pricePerLiter).toBe(6.19)
    expect(res[0].totalValue).toBe(745.895)
    expect(res[0].reportedOdometerKm).toBe(154200)
    expect(res[0].driverId).toBe('MOT-001')
    expect(res[0].gasStation.name).toBe('Posto Ipiranga Centro')
    expect(res[0].gasStation.latitude).toBe(-23.5505)
    expect(res[0].gasStation.longitude).toBe(-46.6333)
  })

  it('deve converter formato brasileiro com vírgula decimal e data DD/MM/YYYY', () => {
    const csvContent = `ROM1001,13/09/2026 14:30:00,Posto Shell Rodovia,-22.6582,-50.4183,GASOLINA,45.0,5.89,265.05,89400`

    const res = CanonicalFuelMapper.parseDelimitedContent(csvContent)

    expect(res).toHaveLength(1)
    expect(res[0].plate).toBe('ROM1001')
    expect(res[0].fuelType).toBe('GASOLINE')
    expect(res[0].liters).toBe(45.0)
    expect(res[0].reportedOdometerKm).toBe(89400)
    expect(res[0].timestamp).toContain('2026-09-13')
  })

  it('deve lançar BadRequestException para arquivo vazio', () => {
    expect(() => CanonicalFuelMapper.parseDelimitedContent('')).toThrow(BadRequestException)
    expect(() => CanonicalFuelMapper.parseDelimitedContent('   \n\n  ')).toThrow(BadRequestException)
  })

  it('deve ignorar comentários com # ou linhas corrompidas', () => {
    const csvContent = `# Comentário da operadora
PLACA;DATA;POSTO;LAT;LON;COMBUSTIVEL;LITROS;PRECO_LITRO;VALOR_TOTAL;ODOMETRO
ABC1234;2026-09-13T10:00:00Z;Posto A;-23.55;-46.63;ETANOL;50;3.89;194.5;10000
LINHA_CORROMPIDA;123
XYZ9876;2026-09-13T12:00:00Z;Posto B;-23.50;-46.60;S500;80;5.99;479.2;20000`

    const res = CanonicalFuelMapper.parseDelimitedContent(csvContent)
    expect(res).toHaveLength(2)
    expect(res[0].plate).toBe('ABC1234')
    expect(res[0].fuelType).toBe('ETHANOL')
    expect(res[1].plate).toBe('XYZ9876')
    expect(res[1].fuelType).toBe('DIESEL_S500')
  })
})


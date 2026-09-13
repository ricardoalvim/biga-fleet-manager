import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import { IncidentTollExternalService } from './incident-toll.external.service.js'
import { TollEventInternalDto } from '../dtos/internal/toll-event.internal.dto.js'
import { IncidentInternalDto } from '../dtos/internal/incident.internal.dto.js'

describe('IncidentTollExternalService', () => {
  let service: IncidentTollExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleToll = new TollEventInternalDto({
    id: 'toll-1',
    tenantId: 'tenant-1',
    vehicleId: 'veh-1',
    tollPlazaName: 'Praça 04 Tietê',
    externalTransactionId: 'TAG-12345',
    amount: 14.8,
    passedAt: '2026-09-12T20:00:00Z',
    createdAt: '2026-09-12T20:00:00Z',
  })

  const sampleIncident = new IncidentInternalDto({
    id: 'inc-1',
    tenantId: 'tenant-1',
    vehicleId: 'veh-1',
    responsibleCompanyId: 'comp-1',
    incidentType: 'ACCIDENT',
    description: 'Colisão traseira',
    estimatedCost: 3500,
    actualCost: 3200,
    status: 'SETTLED',
    occurredAt: '2026-09-12T14:00:00Z',
    settledAt: '2026-09-12T18:00:00Z',
    createdAt: '2026-09-12T14:00:00Z',
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('toll_incident_events_stream'),
    }

    service = new IncidentTollExternalService(
      mockRedis as unknown as Redis,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve publicar evento TOLL_EVENT_REGISTERED no canal Redis', async () => {
    await service.notifyTollEvent(sampleToll)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'toll_incident_events_stream',
      expect.stringContaining('"event":"TOLL_EVENT_REGISTERED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'toll_incident_events_stream',
      expect.stringContaining('"externalTransactionId":"TAG-12345"'),
    )
  })

  it('deve tolerar falha do Redis ao publicar TOLL_EVENT_REGISTERED', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis connection down'))

    await expect(service.notifyTollEvent(sampleToll)).resolves.not.toThrow()
  })

  it('deve publicar evento INCIDENT_REGISTERED no canal Redis', async () => {
    await service.notifyIncident(sampleIncident)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'toll_incident_events_stream',
      expect.stringContaining('"event":"INCIDENT_REGISTERED"'),
    )
  })

  it('deve publicar evento INCIDENT_SETTLED no canal Redis com actualCost', async () => {
    await service.notifyIncidentSettled(sampleIncident)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'toll_incident_events_stream',
      expect.stringContaining('"event":"INCIDENT_SETTLED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'toll_incident_events_stream',
      expect.stringContaining('"actualCost":3200'),
    )
  })
})

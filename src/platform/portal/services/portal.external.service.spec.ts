import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { Redis } from 'ioredis'
import { PortalExternalService } from './portal.external.service.js'
import { SupportTicketInternalDto } from '../dtos/internal/support-ticket.internal.dto.js'

describe('PortalExternalService', () => {
  let service: PortalExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleTicket = new SupportTicketInternalDto({
    id: 'tkt-001',
    tenantId: 'tenant-1',
    openedByUserId: 'usr-1',
    title: 'Erro na homologação de telemetria',
    description: 'Rastreador não está enviando dados de ignição',
    category: 'TECHNICAL',
    priority: 'HIGH',
    status: 'OPEN',
    messages: [
      {
        messageId: 'msg-1',
        authorId: 'usr-1',
        authorName: 'João Operador',
        text: 'Rastreador não está enviando dados de ignição',
        isStaff: false,
        sentAt: '2026-09-12T10:00:00Z',
      },
    ],
    assignedToAgent: null,
    resolvedAt: null,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('portal_events_stream'),
    }

    service = new PortalExternalService(
      mockRedis as unknown as Redis,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve publicar evento SUPPORT_TICKET_OPENED no canal Redis', async () => {
    await service.notifyTicketOpened(sampleTicket)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"event":"SUPPORT_TICKET_OPENED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"ticketId":"tkt-001"'),
    )
  })

  it('deve publicar evento SUPPORT_TICKET_UPDATED no canal Redis', async () => {
    await service.notifyTicketUpdated(sampleTicket)

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"event":"SUPPORT_TICKET_UPDATED"'),
    )
  })

  it('deve publicar evento ONBOARDING_STEP_UPDATED no canal Redis', async () => {
    await service.notifyOnboardingStepUpdated('tenant-1', 2, 'COMPLETED')

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"event":"ONBOARDING_STEP_UPDATED"'),
    )
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"stepIndex":2'),
    )
  })

  it('deve publicar evento TENANT_LICENSES_UPDATED no canal Redis', async () => {
    await service.notifyLicensesUpdated('tenant-1', ['VEHICLES', 'TRIPS'])

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'portal_events_stream',
      expect.stringContaining('"event":"TENANT_LICENSES_UPDATED"'),
    )
  })

  it('deve ser resiliente se o broker Redis estiver offline', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis timeout'))

    await expect(service.notifyTicketOpened(sampleTicket)).resolves.not.toThrow()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { HttpService } from '@nestjs/axios'
import type { Redis } from 'ioredis'
import { of, throwError } from 'rxjs'
import * as crypto from 'crypto'
import { PlatformEcosystemExternalService } from './platform-ecosystem.external.service.js'
import { WebhookSubscriptionInternalDto } from '../dtos/internal/webhook-subscription.internal.dto.js'

describe('PlatformEcosystemExternalService', () => {
  let service: PlatformEcosystemExternalService
  let mockRedis: { publish: ReturnType<typeof vi.fn> }
  let mockHttp: { post: ReturnType<typeof vi.fn> }
  let mockConfig: { get: ReturnType<typeof vi.fn> }

  const sampleWebhook = new WebhookSubscriptionInternalDto({
    id: 'wh-001',
    tenantId: 'tenant-1',
    name: 'ERP Integration',
    targetUrl: 'https://api.erp.example.com/webhooks',
    subscribedEvents: ['trip.finished'],
    secretToken: 'whsec_test_secret_key_1234567890',
    status: 'ACTIVE',
    failureCount: 0,
    lastTriggeredAt: null,
    createdAt: '2026-09-12T20:00:00Z',
    updatedAt: '2026-09-12T20:00:00Z',
  })

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
    }

    mockHttp = {
      post: vi.fn().mockReturnValue(of({ status: 200, data: { received: true } })),
    }

    mockConfig = {
      get: vi.fn().mockReturnValue('platform_events_stream'),
    }

    service = new PlatformEcosystemExternalService(
      mockRedis as unknown as Redis,
      mockHttp as unknown as HttpService,
      mockConfig as unknown as ConfigService,
    )
  })

  it('deve enviar webhook HTTP com assinatura HMAC-SHA256 e cabeçalhos corretos', async () => {
    const data = { tripId: 'trip-100', distanceKm: 45.2 }
    const result = await service.sendWebhook(sampleWebhook, 'trip.finished', data)

    expect(result.success).toBe(true)
    expect(result.statusCode).toBe(200)
    expect(result.deliveryId).toBeDefined()

    expect(mockHttp.post).toHaveBeenCalledWith(
      'https://api.erp.example.com/webhooks',
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Biga-Event': 'trip.finished',
          'X-Biga-Tenant': 'tenant-1',
          'X-Biga-Signature': expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
        }),
      }),
    )

    // Verifica que a assinatura HMAC calculada corresponde ao payload
    const calledPayload = mockHttp.post.mock.calls[0][1] as string
    const expectedSig = `sha256=${crypto
      .createHmac('sha256', sampleWebhook.secretToken)
      .update(calledPayload)
      .digest('hex')}`

    const calledHeaders = mockHttp.post.mock.calls[0][2].headers
    expect(calledHeaders['X-Biga-Signature']).toBe(expectedSig)
  })

  it('deve registrar auditoria no Redis ao disparar com sucesso', async () => {
    await service.sendWebhook(sampleWebhook, 'trip.finished', { test: true })

    expect(mockRedis.publish).toHaveBeenCalledWith(
      'platform_events_stream',
      expect.stringContaining('"event":"WEBHOOK_DELIVERY_SUCCESS"'),
    )
  })

  it('deve ser resiliente a erros HTTP de destino sem lançar exceção', async () => {
    mockHttp.post.mockReturnValueOnce(throwError(() => new Error('Connection refused')))

    const result = await service.sendWebhook(sampleWebhook, 'trip.finished', { test: true })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Connection refused')
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'platform_events_stream',
      expect.stringContaining('"event":"WEBHOOK_DELIVERY_FAILED"'),
    )
  })

  it('deve ser resiliente se o broker Redis estiver offline ao publicar auditoria', async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis connection lost'))

    await expect(service.notifyPlatformAudit({ event: 'TEST_AUDIT' })).resolves.not.toThrow()
  })
})

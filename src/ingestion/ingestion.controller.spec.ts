import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { REDIS_PUBLISHER } from '../platform/redis/redis.tokens.js'
import { IngestionController } from './ingestion.controller.js'
import { IngestionPublisher } from './ingestion.publisher.js'

describe('IoT ingestion gateway', () => {
  let app: INestApplication
  const publish = vi.fn().mockResolvedValue(1)

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        IngestionPublisher,
        { provide: REDIS_PUBLISHER, useValue: { publish } },
        { provide: ConfigService, useValue: { get: () => 'vehicle_telemetry_stream' } },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new StandardSchemaValidationPipe())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('accepts an agnostic envelope and returns 202', async () => {
    const payload = {
      tenantId: '00000000-0000-4000-8000-000000000001',
      deviceId: '00000000-0000-4000-8000-000000000010',
      lat: -22.66,
      lng: -50.41,
      speed: 40,
      ignition: true,
    }

    await request(app.getHttpServer()).post('/telemetry/ingest').send(payload).expect(202)
    expect(publish).toHaveBeenCalled()
  })

  it('rejects chariot-era field names', async () => {
    await request(app.getHttpServer())
      .post('/telemetry/ingest')
      .send({ bigaId: 'nope', lat: 0, lng: 0 })
      .expect(400)
  })
})

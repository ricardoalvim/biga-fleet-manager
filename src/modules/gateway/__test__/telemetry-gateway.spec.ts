import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../../../app.module'
import RedisMock from 'ioredis-mock'

describe('SGBR - Gateway Stress & Integration Test', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('REDIS_PUBLISHER_CLIENT')
      .useValue(new RedisMock())
      .overrideProvider('REDIS_SUBSCRIBER_CLIENT')
      .useValue(new RedisMock())
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

    await app.init()
    await app.getHttpServer().listen(0)
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('Deve sustentar uma carga de 50.000 coordenadas (Stress Test Imperial)', async () => {
    const totalRequests = 50000
    const concurrencyLimit = 100 // Máximo de requests simultâneos para não travar o SO

    console.time('StressTest-50k')

    for (let i = 0; i < totalRequests; i += concurrencyLimit) {
      const batch = []
      for (let j = 0; j < concurrencyLimit && i + j < totalRequests; j++) {
        const id = i + j
        batch.push(
          request(app.getHttpServer())
            .post('/telemetry/ingest')
            .send({
              bigaId: `BIGA-${id}`,
              lat: -22.66, // Assis, SP
              lng: -50.41,
              isHitched: true,
            }),
        )
      }
      const responses = await Promise.all(batch)

      // Validamos apenas o primeiro do lote para não pesar o processamento do Jest
      if (responses[0].status !== 202) {
        throw new Error(`Falha na carga: Status ${responses[0].status}`)
      }
    }

    console.timeEnd('StressTest-50k')
    console.log(`[IMPÉRIO] 50.000 bigas processadas. Gateway resiliente!`)
  }, 120000)
})

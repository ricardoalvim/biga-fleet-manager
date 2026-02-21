
import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class TelemetrySubscriberService implements OnModuleInit {
    private readonly logger = new Logger(TelemetrySubscriberService.name)

    constructor(
        @Inject('REDIS_SUBSCRIBER_CLIENT') private readonly redisSubscriber: Redis
    ) { }

    onModuleInit() {
        this.redisSubscriber.subscribe('biga_telemetry_stream', (err, count) => {
            if (err) {
                this.logger.error('Falha ao assinar o canal das bigas', err)
                return
            }
            this.logger.log(`Inscrito no canal de telemetria. Ouvindo ${count} canal(is).`)
        })

        this.redisSubscriber.on('message', (channel, message) => {
            if (channel === 'biga_telemetry_stream') {
                this.processIncomingTelemetry(message)
            }
        })
    }

    private processIncomingTelemetry(message: string) {
        const payload = JSON.parse(message)
        this.logger.log(`[TELEMETRIA RECEBIDA] Biga: ${payload.bigaId} | Lat: ${payload.lat}, Lng: ${payload.lng}`)

        // TODO: Aqui a gente vai disparar o evento interno do NestJS 
        // para atualizar o painel e calcular o desgaste da roda
    }
}
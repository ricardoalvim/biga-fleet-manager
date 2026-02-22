import { Controller, Get } from '@nestjs/common'
import {
    HealthCheckService,
    MongooseHealthIndicator,
    MemoryHealthIndicator,
    HealthCheck
} from '@nestjs/terminus'

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private mongo: MongooseHealthIndicator,
        private memory: MemoryHealthIndicator
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.mongo.pingCheck('mongodb'),

            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

            async () => ({
                biga_fleet: {
                    status: 'up',
                    message: "Something wonderful is happening to your BIGA FLEET: it's alive"
                }
            })
        ])
    }
}
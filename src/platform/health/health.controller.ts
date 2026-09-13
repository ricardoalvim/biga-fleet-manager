import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus'

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongo: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongo.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => ({
        fleet: {
          status: 'up' as const,
          message: 'Fleet manager is alive',
        },
      }),
    ])
  }
}

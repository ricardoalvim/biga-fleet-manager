import { Global, Module } from '@nestjs/common'
import { MetricsController } from './controllers/metrics.controller.js'
import { MetricsService } from './services/metrics.service.js'
import { LoggingInterceptor } from './interceptors/logging.interceptor.js'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, LoggingInterceptor],
  exports: [MetricsService, LoggingInterceptor],
})
export class ObservabilityModule {}

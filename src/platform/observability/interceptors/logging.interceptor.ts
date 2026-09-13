import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Request, Response } from 'express'
import { MetricsService } from '../services/metrics.service.js'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const req = httpContext.getRequest<Request>()
    const res = httpContext.getResponse<Response>()

    const startTime = Date.now()
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID()
    const tenantId = (req.headers['x-tenant-id'] as string) || 'global'

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('x-trace-id', traceId)
    }

    const { method, originalUrl } = req
    const normalizedRoute = this.normalizeRoute(originalUrl || req.url)

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime
          const statusCode = res.statusCode || 200
          const durationSeconds = durationMs / 1000

          this.metricsService.recordHttpRequest(
            method,
            normalizedRoute,
            statusCode,
            durationSeconds,
          )

          const logEntry = JSON.stringify({
            level: 'info',
            traceId,
            tenantId,
            timestamp: new Date().toISOString(),
            method,
            route: normalizedRoute,
            statusCode,
            durationMs,
          })
          this.logger.log(logEntry)
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startTime
          let statusCode = 500
          let errorMessage = 'Internal Server Error'

          if (err instanceof HttpException) {
            statusCode = err.getStatus()
            errorMessage = err.message
          } else if (err instanceof Error) {
            errorMessage = err.message
          } else if (typeof err === 'object' && err !== null) {
            const errObj = err as Record<string, unknown>
            if (typeof errObj.status === 'number') {
              statusCode = errObj.status
            } else if (typeof errObj.statusCode === 'number') {
              statusCode = errObj.statusCode
            }
            if (typeof errObj.message === 'string') {
              errorMessage = errObj.message
            }
          }

          const durationSeconds = durationMs / 1000

          this.metricsService.recordHttpRequest(
            method,
            normalizedRoute,
            statusCode,
            durationSeconds,
          )

          const logEntry = JSON.stringify({
            level: 'error',
            traceId,
            tenantId,
            timestamp: new Date().toISOString(),
            method,
            route: normalizedRoute,
            statusCode,
            durationMs,
            errorMessage,
          })
          this.logger.error(logEntry)
        },
      }),
    )
  }

  private normalizeRoute(url: string): string {
    const pathWithoutQuery = url.split('?')[0]
    // Substitui UUIDs por :id para agregação limpa no Prometheus
    return pathWithoutQuery.replace(
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
      ':id',
    )
  }
}

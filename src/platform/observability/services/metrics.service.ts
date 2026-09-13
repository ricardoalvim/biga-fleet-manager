import { Injectable } from '@nestjs/common'

export interface HttpMetricEntry {
  readonly method: string
  readonly route: string
  readonly status: number
  readonly durationSeconds: number
}

@Injectable()
export class MetricsService {
  private readonly httpRequestsCounter = new Map<string, number>()
  private readonly httpDurations = new Map<string, number[]>()
  private readonly telemetryPacketsCounter = new Map<string, number>()
  private activeSseConnections = 0

  recordHttpRequest(method: string, route: string, status: number, durationSeconds: number): void {
    const key = `${method}:${route}:${status}`
    const current = this.httpRequestsCounter.get(key) ?? 0
    this.httpRequestsCounter.set(key, current + 1)

    const routeKey = `${method}:${route}`
    const durations = this.httpDurations.get(routeKey) ?? []
    durations.push(durationSeconds)
    // Manter histórico das últimas 1000 durações por rota
    if (durations.length > 1000) {
      durations.shift()
    }
    this.httpDurations.set(routeKey, durations)
  }

  recordTelemetryIngested(protocol: string, count = 1): void {
    const current = this.telemetryPacketsCounter.get(protocol) ?? 0
    this.telemetryPacketsCounter.set(protocol, current + count)
  }

  setActiveSseConnections(count: number): void {
    this.activeSseConnections = Math.max(0, count)
  }

  incrementActiveSseConnections(): void {
    this.activeSseConnections += 1
  }

  decrementActiveSseConnections(): void {
    this.activeSseConnections = Math.max(0, this.activeSseConnections - 1)
  }

  getActiveSseConnections(): number {
    return this.activeSseConnections
  }

  getPrometheusMetrics(): string {
    const lines: string[] = []

    // 1. Informações de Memória do Processo Node.js
    const memory = process.memoryUsage()
    lines.push('# HELP nodejs_heap_used_bytes Process heap memory used in bytes.')
    lines.push('# TYPE nodejs_heap_used_bytes gauge')
    lines.push(`nodejs_heap_used_bytes ${memory.heapUsed}`)
    lines.push('# HELP nodejs_heap_total_bytes Process heap memory total in bytes.')
    lines.push('# TYPE nodejs_heap_total_bytes gauge')
    lines.push(`nodejs_heap_total_bytes ${memory.heapTotal}`)
    lines.push('# HELP nodejs_rss_bytes Process resident set size in bytes.')
    lines.push('# TYPE nodejs_rss_bytes gauge')
    lines.push(`nodejs_rss_bytes ${memory.rss}`)

    // 2. Conexões SSE Ativas
    lines.push(
      '# HELP active_sse_connections_gauge Current active Server-Sent Events subscriber connections.',
    )
    lines.push('# TYPE active_sse_connections_gauge gauge')
    lines.push(`active_sse_connections_gauge ${this.activeSseConnections}`)

    // 3. Contadores de Requisições HTTP
    lines.push('# HELP http_requests_total Total number of HTTP requests processed.')
    lines.push('# TYPE http_requests_total counter')
    for (const [key, count] of this.httpRequestsCounter.entries()) {
      const [method, route, status] = key.split(':')
      lines.push(
        `http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`,
      )
    }

    // 4. Percentis de Duração de Requisição (p50, p95, p99)
    lines.push(
      '# HELP http_request_duration_seconds Latency percentiles of HTTP requests in seconds.',
    )
    lines.push('# TYPE http_request_duration_seconds summary')
    for (const [routeKey, durations] of this.httpDurations.entries()) {
      const [method, route] = routeKey.split(':')
      if (durations.length === 0) continue

      const sorted = [...durations].sort((a, b) => a - b)
      const p50 = this.getPercentile(sorted, 0.5)
      const p95 = this.getPercentile(sorted, 0.95)
      const p99 = this.getPercentile(sorted, 0.99)
      const sum = sorted.reduce((acc, val) => acc + val, 0)

      lines.push(
        `http_request_duration_seconds{method="${method}",route="${route}",quantile="0.5"} ${p50.toFixed(4)}`,
      )
      lines.push(
        `http_request_duration_seconds{method="${method}",route="${route}",quantile="0.95"} ${p95.toFixed(4)}`,
      )
      lines.push(
        `http_request_duration_seconds{method="${method}",route="${route}",quantile="0.99"} ${p99.toFixed(4)}`,
      )
      lines.push(
        `http_request_duration_seconds_sum{method="${method}",route="${route}"} ${sum.toFixed(4)}`,
      )
      lines.push(
        `http_request_duration_seconds_count{method="${method}",route="${route}"} ${sorted.length}`,
      )
    }

    // 5. Ingestão Telemática por Protocolo
    lines.push(
      '# HELP telemetry_packets_ingested_total Total raw IoT packets ingested by protocol.',
    )
    lines.push('# TYPE telemetry_packets_ingested_total counter')
    for (const [protocol, count] of this.telemetryPacketsCounter.entries()) {
      lines.push(`telemetry_packets_ingested_total{protocol="${protocol}"} ${count}`)
    }

    return `${lines.join('\n')}\n`
  }

  resetMetrics(): void {
    this.httpRequestsCounter.clear()
    this.httpDurations.clear()
    this.telemetryPacketsCounter.clear()
    this.activeSseConnections = 0
  }

  private getPercentile(sorted: number[], quantile: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil(quantile * sorted.length) - 1
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
  }
}

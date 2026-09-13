# Specification: DevOps, CI/CD & Observability Module (Automação, Infraestrutura e Monitoramento)

## 1. Visão Geral
Este módulo define a esteira de entrega contínua, a conteinerização multi-stage, a orquestração via Kubernetes com escalabilidade horizontal (HPA) e a observabilidade sistêmica do **Biga Fleet Manager**. Ele assegura que atualizações de código passem por baterias rigorosas de testes automáticos antes de subir para produção, além de garantir telemetria e rastreamento de performance (*APM*) em tempo real no padrão **Prometheus**, suportando implantações nativas na nuvem ou em ambientes isolados *on-premises*.

---

## 2. Pilares de Arquitetura e Engenharia

### 2.1. Pipeline de CI/CD Automatizado (`.github/workflows/ci.yml`)
* **Gatilhos de Qualidade:** A cada `Pull Request` ou push nas branches `main` e `develop`, o pipeline automatizado executa sequencialmente:
  1. Inicialização de serviços conteinerizados de infraestrutura (PostgreSQL, MongoDB e Redis).
  2. Instalação limpa de dependências (`npm ci`).
  3. Validação estrita de tipos do backend (`npx tsc --noEmit`).
  4. Validação estrita de tipos do frontend portal (`npx tsc -p frontend/tsconfig.json`).
  5. Varredura completa de linter (`npm run lint` com regras de type checking e Prettier).
  6. Execução da suíte completa de testes unitários (`npm test` via Vitest), exigindo 100% de taxa de sucesso.
  7. Compilação de produção (`npm run build`).

### 2.2. Implantação Híbrida & Conteinerização (Docker & Kubernetes)
* **Dockerfile Multi-Stage Otimizado:** Separação rígida entre estágio de compilação (`builder`) e imagem mínima de produção (`runner`), operando sob usuário não-root (`node`) com verificação de integridade nativa (`HEALTHCHECK /health`).
* **Docker Compose Stack (`docker-compose.yml`):** Orquestração completa dos serviços locais: API, PostgreSQL 15, MongoDB 7, Redis 7 e Prometheus 2.50.
* **Orquestração Kubernetes (`k8s/`):**
  * `k8s/deployment.yaml`: Estratégia de *RollingUpdate* sem indisponibilidade (`maxSurge: 1`, `maxUnavailable: 0`), sondas de vivacidade (`livenessProbe`) e prontidão (`readinessProbe`), anotações para raspagem Prometheus.
  * `k8s/service.yaml`: Exposição de portas de serviço.
  * `k8s/hpa.yaml`: Horizontal Pod Autoscaler com escalabilidade automática de 2 a 10 réplicas baseada em 70% de CPU e volume de memória sob rajadas de ingestão IoT.
  * `k8s/configmap.yaml`: Configurações de ambiente para canais Redis e runtime.

### 2.3. Observabilidade e Métricas (Prometheus + Tracing Estruturado)
* **Métricas de Performance (`GET /metrics`):**
  * `http_requests_total{method, route, status}`: Contador acumulado de requisições por rota normalizada.
  * `http_request_duration_seconds{method, route, quantile}`: Resumo de latência nos percentis p50, p95 e p99.
  * `telemetry_packets_ingested_total{protocol}`: Contagem de pacotes brutos IoT ingeridos (Suntech, Teltonika, Queclink).
  * `active_sse_connections_gauge`: Monitoramento em tempo real do número de clientes conectados no stream de mapa.
  * `nodejs_heap_used_bytes`, `nodejs_heap_total_bytes`, `nodejs_rss_bytes`: Métricas de consumo de memória do processo.
* **Rastreamento Estruturado (Tracing JSON):**
  * O `LoggingInterceptor` gera automaticamente um `traceId` único (`crypto.randomUUID()`) ou reaproveita o cabeçalho `x-trace-id`, propagando-o para os headers de resposta e imprimindo logs estruturados em JSON contendo `traceId`, `tenantId`, método, rota normalizada, statusCode e `durationMs`.

---

## 3. Estrutura do Módulo de Observabilidade (`src/platform/observability/`)

```
src/platform/observability/
├── controllers/
│   ├── metrics.controller.ts            # Endpoint GET /metrics formatado no padrão Prometheus
│   └── metrics.controller.spec.ts       # Testes unitários do controller
├── interceptors/
│   ├── logging.interceptor.ts           # Interceptor global para traceId e métricas HTTP
│   └── logging.interceptor.spec.ts      # Testes unitários do interceptor
├── services/
│   ├── metrics.service.ts               # Registry de métricas em memória e renderizador Prometheus
│   └── metrics.service.spec.ts          # Testes unitários de percentis e contadores
└── observability.module.ts              # Módulo global NestJS registrado no AppModule
```
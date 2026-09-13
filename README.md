# 🚚 Biga Fleet Manager

[![NestJS](https://img.shields.io/badge/NestJS-12.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%2F6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM_8-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x_Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x_Pub%2FSub-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/Vitest-206_Tests_100%25-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Throughput](https://img.shields.io/badge/k6_Benchmark-5%2C819_req%2Fs-0052CC?style=flat-square&logo=k6&logoColor=white)](https://k6.io/)

An **Enterprise-Grade Connected Fleet Management, Real-Time Telemetry & Anti-Fraud Platform**. Engineered with **Clean Architecture (Hexagonal / Ports & Adapters)**, asynchronous stream processing, and specialized **Polyglot Persistence**, designed to scale from local transportation fleets to multi-million asset global operators.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Enterprise Feature Matrix](#-enterprise-feature-matrix)
- [Polyglot Storage Topology](#-polyglot-storage-topology)
- [Frontend Enterprise Portal (React 19)](#-frontend-enterprise-portal-react-19)
- [Performance & Stress Benchmarks](#-performance--stress-benchmarks)
- [Technology Stack](#-technology-stack)
- [Domain Modules](#-domain-modules)
- [Quick Start](#-quick-start)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Observability & DevOps](#-observability--devops)
- [Contributing & Architecture Guidelines](#-contributing--architecture-guidelines)

---

## 🏛️ Architectural Overview

Biga Fleet Manager is structured as a **Modular Monolith** prepared for microservice extraction, adhering strictly to **Domain-Driven Design (DDD)** and **Clean Architecture**:

```
                               ┌─────────────────────────────────────────┐
                               │     FRONTEND ENTERPRISE PORTAL (SPA)   │
                               │   React 19 • Vite 6 • Tailwind CSS      │
                               │  SSE Live Map • Dynamic RBAC • i18n     │
                               └────────────────────┬────────────────────┘
                                                    │ REST / SSE
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BACKEND PLATFORM (NestJS 12)                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🛡️ Tenancy Middleware (AsyncLocalStorage) ➔ Strict isolation by x-tenant-id / x-tenant-slug             │
├───────────────────────────────────┬──────────────────────────────────┬─────────────────────────────────┤
│         FLEET DOMAIN              │        STREAMING & INGESTION     │       PLATFORM & ECOSYSTEM      │
│ • Vehicle & Tripartite Ownership  │ • IoT Telemetry Ingestion Gateway│ • HMAC-SHA256 Signed Webhooks   │
│ • Trip & Waypoint Lifecycle       │ • SSE Realtime Stream Engine     │ • OpenAPI / Swagger Marketplace │
│ • Route Planning (Haversine VRP)  │ • Vehicle Rate-Throttler (3s)    │ • Tenant White-Label Injection  │
│ • Maintenance (Preventive/Orders) │ • Redis Pub/Sub Event Bus        │ • Prometheus Metrics (/metrics) │
│ • Toll Audit (Tag vs GPS Track)   │ • Ignition State Bypass Filter   │ • Structured JSON Tracing       │
│ • Fuel Conciliation & Anti-Fraud  │                                  │ • Kubernetes Health Probes      │
├───────────────────────────────────┴──────────────────────────────────┴─────────────────────────────────┤
│ Internal vs External Services: Every domain strictly segregates pure business logic (*.internal.service) │
│ from infrastructure and I/O adapters (*.external.service). DTOs are immutable readonly records.          │
└───────────────────────────────────┬──────────────────┬─────────────────────────────────────────────────┘
                                    │                  │
                ┌───────────────────▼───┐          ┌───▼───────────────────┐          ┌───────────────────┐
                │  PostgreSQL (Prisma)  │          │   MongoDB (Mongoose)  │          │   Redis (ioredis) │
                │  ACID Master Records  │          │   Time-Series Telemetry│          │   Pub/Sub, Stream │
                │  Companies, Vehicles, │          │   Toll & Fuel Audits, │          │   Throttling &    │
                │  Trips, Tenants       │          │   Maintenance Records │          │   Live State      │
                └───────────────────────┘          └───────────────────────┘          └───────────────────┘
```

---

## ✨ Enterprise Feature Matrix

### 1. 🛡️ Native Multitenancy (`AsyncLocalStorage`)
Zero data leakage across organizations. Requests resolve the tenant via `x-tenant-id` header or `x-tenant-slug` subdomain. Context is propagated through Node.js `AsyncLocalStorage` (`TenantContext`), isolating database queries and cache keys without polluting service signatures.

### 2. ⚡ Real-Time Streaming & Telemetry (SSE Engine)
- **Live Server-Sent Events:** High-efficiency telemetry streaming directly to client dashboards.
- **Dynamic 3,000ms Throttler:** Filters out high-frequency GPS ping noise while automatically bypassing the throttle when ignition changes state for immediate security alerting.
- **Redis Pub/Sub:** Broadcasts telemetry events across horizontally scaled worker instances.

### 3. ⛽ Fuel Conciliation & Anti-Fraud Engine
- **Cross-Geolocation vs GPS Shadow:** Haversine distance verification between gas station and vehicle coordinates. Includes a **30-minute signal buffer** (`GPS_SHADOW_OR_DELAY_BUFFER`) to eliminate false positives in tunnels, valleys, or cellular transmission delays.
- **Physical Tank Capacity:** Detects fuel siphoning and card misuse if liters supplied exceed physical reservoir volume ($+5\%$ thermal/neck tolerance).
- **Odometer Anomaly & Km/L:** Flags meter rolling regressions and mathematically impossible consumption ratios.
- **Active Workshop Context:** Automatically mitigates suspicion (`WORKSHOP_GEO_FENCE_OR_ACTIVE_OS`) if the vehicle has an open work order in `MaintenanceModule`.
- **Polyglot Ingestion:** Modern JSON REST endpoints (`POST /api/v1/fuel/reconcile/batch`) and legacy delimited file parsers (`CanonicalFuelMapper`) for Ticket Log, ValeCard, Good Card, Shell, and Ipiranga TXT/CSV layouts.

### 4. 🛣️ Route Planning & Geodesic Calculation
- **Haversine Distance:** Microsecond-precision geodetic distance calculations between coordinates.
- **Multi-Factor Consumption:** Estimates diesel/fuel consumption based on vehicle classification, cargo weight factor, and terrain complexity.
- **Waypoint Sequence Dispatch:** Tracks path deviations and estimated time of arrival (ETA).

### 5. 🛠️ Preventive Maintenance & Asset Downtime
- **Automatic Triggers:** Generates preventive work orders based on accumulated odometer (km) and engine hourmeter thresholds.
- **Financial Downtime Costing:** Quantifies downtime hours, parts cost, and hourly labor rates.

### 6. 🏷️ Electronic Toll Audit (Anti-Overbilling)
- Reconciles automated toll tag passages (Sem Parar, ConectCar, Veloe) against GPS track logs to contest phantom or misclassified vehicle toll charges.

### 7. 🔗 Platform Ecosystem & Webhooks
- **HMAC-SHA256 Signatures:** Dispatches secure webhooks with `X-Biga-Signature` cryptographic hashes and delivery tracking (`X-Biga-Delivery`).
- **OpenAPI Marketplace:** Interactive Swagger interface with live *Try-it-Out* capabilities for ERP and TMS integrations.

---

## 💾 Polyglot Storage Topology

| Storage Engine | Technology | Responsibility |
| :--- | :--- | :--- |
| **Relational (ACID)** | **PostgreSQL 16+** via **Prisma ORM 8** | Organizations, Tenants, Companies, Vehicles (Owner/Contractor/Custodian), and Trips. |
| **Time-Series Document** | **MongoDB 7+** via **Mongoose** | High-density GPS telemetry points, Fuel Audit logs, Toll events, and Maintenance orders. |
| **Distributed In-Memory** | **Redis 7+** via **ioredis** | Pub/Sub messaging bus, vehicle rate-limiting keys, Georeverse caching, and live positioning buffers. |

---

## 🖥️ Frontend Enterprise Portal (React 19)

Located in [`frontend/`](file:///home/rick/Documentos/Projetos/biga-fleet-manager/frontend):
* **State of the Art:** Built on **React 19 (`^19.0.0`)**, **Vite 6 (`^6.0.0`)**, and **Tailwind CSS**.
* **Live Fleet Map ([`LiveFleetMap.tsx`](file:///home/rick/Documentos/Projetos/biga-fleet-manager/frontend/src/realtime/LiveFleetMap.tsx)):** Real-time vector SVG canvas rendering heading degrees, velocity, moving/stopped status pulses, and live alert feeds.
* **Universal Dynamic White-Label:** Zero custom builds! Themes, primary colors (`branding.primaryColor`), and logos (`branding.logoUrl`) are injected dynamically per tenant at runtime from a single production build.
* **Reactive i18n:** Real-time multi-language switcher supporting **Português (pt-BR)**, **English (en-US)**, **Español (es-ES)**, and **Deutsch (de-DE)**.
* **Dynamic RBAC:** Menus and operational actions react dynamically to user roles (*Global Admin, Tenant Manager, Fleet Operator, Auditor*).
* **5-Step Onboarding Wizard:** Guided tenant calibration journey with dynamic progress tracking.

---

## 📊 Performance & Stress Benchmarks

Under automated stress benchmark testing via k6 and Vitest (`load-tests/`):

```
===========================================================================
📊 STRESS BENCHMARK RESULTS (1,000 Concurrent Ingestion Requests)
===========================================================================
• Processed Requests:      1,000
• Total Time Elapsed:      0.17s
• Average Throughput:      5,819 req/s
• HTTP Error Rate:         0.00%
• Median Latency (p50):    1.76 ms
• Percentile 95 (p95):     2.92 ms
• Percentile 99 (p99):     5.08 ms
===========================================================================

📋 SERVICE LEVEL OBJECTIVES (SLO) AUDIT:
┌─────────────────────────────┬──────────────┬──────────────┬─────────────┐
│ Performance Metric          │ Target (SLO) │ Measured     │ Status      │
├─────────────────────────────┼──────────────┼──────────────┼─────────────┤
│ HTTP Error Rate             │ < 1.0%       │ 0.00%        │ 🟢 PASSED   │
│ Global Average Latency      │ < 150 ms     │ 1.96 ms      │ 🟢 PASSED   │
│ Percentile 95 (p95)         │ < 250 ms     │ 2.92 ms      │ 🟢 PASSED   │
│ Percentile 99 (p99)         │ < 500 ms     │ 5.08 ms      │ 🟢 PASSED   │
│ Ingestion Throughput        │ > 1000 req/s │ 5,819 req/s  │ 🟢 PASSED   │
└─────────────────────────────┴──────────────┴──────────────┴─────────────┘
```

> **Horizontal Capacity:** With an average vehicle transmitting GPS pings every 30 seconds ($0.033\text{ req/s}$), **a single NestJS pod sustains ~175,000 active vehicles**. A 30-pod Kubernetes cluster smoothly orchestrates **over 5.25 million connected vehicles**.

---

## 🛠️ Technology Stack

- **Backend:** Node.js 22 LTS, NestJS 12 (ESM), TypeScript 5.x/6.x
- **Frontend:** React 19, Vite 6, Tailwind CSS, Lucide Icons
- **Databases:** PostgreSQL 16 (Prisma ORM), MongoDB 7 (Mongoose), Redis 7 (ioredis)
- **Validation:** Zod (Standard Schema validation at runtime and compile-time)
- **Testing:** Vitest (206 unit/integration tests, 100% pass rate)
- **Load Testing:** k6, TypeScript Benchmark Runner
- **DevOps:** Docker Multi-stage, Kubernetes Manifests (HPA, Liveness/Readiness Probes), GitHub Actions CI

---

## 📦 Domain Modules

```
src/
├── fleet/
│   ├── company/             # Company profiles and tax relationships
│   ├── vehicle/             # Tripartite vehicle management (Owner, Contractor, Custodian)
│   ├── trip/                # Trip execution, telemetry aggregation, and lifecycle
│   ├── route-planning/      # Geodesic routing, waypoint dispatch, and fuel estimates
│   ├── maintenance/         # Preventative maintenance plans and downtime costing
│   ├── incident-toll/       # Accident claims and electronic toll tag reconciliation
│   ├── fuel/                # Anti-fraud engine, tank validation, and CSV/TXT parsers
│   └── overview/            # Multi-tenant executive KPI dashboard
├── platform/
│   ├── streaming/           # Server-Sent Events (SSE) and vehicle rate throttling
│   ├── ecosystem/           # HMAC-SHA256 signed webhooks and tenant integrations
│   ├── portal/              # Tenant white-label profiles, RBAC, and support tickets
│   ├── observability/       # Prometheus /metrics, JSON logging interceptor, and k6
│   ├── persistence/         # PrismaService and MongoDB/Redis connectors
│   └── geo/                 # Reverse geocoding and caching layers
├── tenancy/                 # Multitenancy resolution and AsyncLocalStorage context
└── ingestion/               # High-throughput IoT gateway
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (v22 recommended)
- npm 10+

### 1. Start Infrastructure
```bash
docker compose up -d
```
*This brings up PostgreSQL on port `5432`, MongoDB on port `27017`, and Redis on port `6379`.*

### 2. Configure Environment
```bash
cp .env.example .env
```
Default connection strings are pre-calibrated for local containerized development:
```env
PORT=2342
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/biga_fleet?schema=public"
MONGO_URL="mongodb://admin:admin@localhost:27017/biga_fleet?authSource=admin"
REDIS_URL="redis://localhost:6379"
```

### 3. Install Dependencies & Initialize Database
```bash
npm install
npm run db:seed
```

### 4. Start the Application
```bash
# Start Backend in development watch mode
npm run start:dev

# Or start the Frontend Enterprise Portal
cd frontend && npm install && npm run dev
```

* Backend API: `http://localhost:2342`
* OpenAPI Swagger Documentation: `http://localhost:2342/api/docs`
* Prometheus Metrics: `http://localhost:2342/metrics`
* Frontend Portal: `http://localhost:5173`

---

## 🧪 Testing & Quality Assurance

All modifications are strictly backed by automated test specifications:

```bash
# Run the complete test suite (206 tests across 33 test files)
npm test

# Run tests with interactive UI
npm run test:ui

# Run the automated stress benchmark
npm run test:stress

# Run k6 load simulation
k6 run load-tests/stress-simulation.js

# Lint codebase
npm run lint

# Build for production
npm run build
```

---

## 🔍 Observability & DevOps

- **Structured Logging:** All HTTP interactions are logged as JSON containing timestamp, method, route, status, duration, `traceId`, and `tenantId`.
- **Prometheus Metrics:** Integrated metrics exposed at `/metrics` tracking `http_requests_total` and `http_request_duration_seconds` grouped by method, route, and status code.
- **Kubernetes Ready:** Includes manifests in `k8s/` with `HorizontalPodAutoscaler` (HPA), resource limits, and health probes (`/health/liveness`, `/health/readiness`, `/health/startup`).

---

## 📄 Documentation & Evolution

- [`OVERVIEW.md`](file:///home/rick/Documentos/Projetos/biga-fleet-manager/OVERVIEW.md): Comprehensive executive analysis, market TAM/SAM/SOM, circuit breakers, and benchmarking against Samsara, Geotab, and Golfleet.
- [`BIGAEVO1.md`](file:///home/rick/Documentos/Projetos/biga-fleet-manager/BIGAEVO1.md): Technical retrospective detailing the transformation from prototype to enterprise grade.
- [`walkthrough.md`](file:///home/rick/.gemini/antigravity/brain/3b339009-6e80-4264-adfc-a84dde6192df/walkthrough.md): Continuous delivery walkthrough recording all recent feature implementations and test audits.
- [`docs/specs/architecture-guidelines.md`](file:///home/rick/Documentos/Projetos/biga-fleet-manager/docs/specs/architecture-guidelines.md): Mandatory architectural guidelines for module development.

---

## 👤 Author & License

* **Author:** Rick Alvim
* **License:** Proprietary - All rights reserved.
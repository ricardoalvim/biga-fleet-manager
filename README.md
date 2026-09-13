# Fleet Manager

A real-time asset tracking and fleet management system built with **Polyglot Persistence** architecture and asynchronous processing. Designed to handle high-volume telemetry ingestion while maintaining business data consistency.

## 📋 Overview

Biga Fleet Manager is a **PIMS de frotas** (the name is a 2013 joke about a Roman chariot rental running on JPA/JSF). Domain language is **vehicle**. It is a **modular monolith** on NestJS 12 (ESM + Standard Schema): multi-tenancy, relational fleet data on PostgreSQL, MongoDB telemetry, and an agnostic IoT ingestion gateway.

## 🏗️ Architecture & Technical Decisions

Modular monolith with isolated bounded contexts:

| Context | Path | Responsibility |
|---|---|---|
| Platform | `src/platform/` | Config (Zod), Prisma, Redis, Mongo, health, geocoding |
| Tenancy | `src/tenancy/` | Tenant CRUD and `x-tenant-id` request context |
| Fleet | `src/fleet/` | Companies, vehicles, trips, dashboard (PostgreSQL) |
| Ingestion | `src/ingestion/` | Protocol-agnostic IoT ingest (validate + Redis publish, HTTP 202) |
| Telemetry | `src/telemetry/` | Mongo writes and trip lifecycle from the bus |

The ingestion gateway does **not** start or finish trips. It accepts `{ tenantId, deviceId, lat, lng, speed, ignition }` and publishes to Redis. Telemetry processing maps `deviceId` to a vehicle and owns the trip lifecycle.

### 💾 Polyglot Persistence Strategy

- **PostgreSQL (Prisma ORM):** Handles transactional data (ACID compliant). Manages fleet entities, companies, and trip lifecycle data.
- **MongoDB (Mongoose):** Time-series database for telemetry data. Efficiently stores GPS traces at scale for high-volume reads.
- **Redis (ioredis):** Messaging layer (Pub/Sub) for asynchronous ingestion and **Georeverse Caching**. Coordinates are transformed into real addresses and cached to reduce latency and external API costs (Nominatim/Google).

### 🛠️ Key Implementation Features

- **Intelligent Georeverse Caching:** Location-based address caching with geographic precision in Redis.
- **Event-Driven Trip Lifecycle:** Trip completion is automatically detected via ignition signals in telemetry payloads, triggering route reconstruction and distance calculation.
- **Dockerized Environment:** Complete stack running in containers (Node.js, PostgreSQL, MongoDB, Redis).
- **Real-time Telemetry Processing:** Asynchronous ingestion with Redis Pub/Sub for high-throughput data processing.
- **RESTful API:** Comprehensive REST API with OpenAPI/Swagger documentation.

## 🚀 Features

### Core Functionality
- **Fleet Management:** CRUD operations for vehicles, companies, and fleet assignments
- **Real-time Tracking:** GPS telemetry ingestion and processing
- **Trip Management:** Automated trip lifecycle with start/end detection
- **Geolocation Services:** Address resolution with intelligent caching
- **Health Monitoring:** System health checks and monitoring endpoints

### Technical Capabilities
- High-throughput telemetry ingestion (Redis Pub/Sub)
- Polyglot data persistence
- Asynchronous processing pipelines
- Docker containerization
- Comprehensive API documentation
- Database migrations and seeding

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS 12 (ESM, Standard Schema / Zod)
- **Language:** TypeScript
- **ORM:** Prisma ORM 8 (`@prisma/orm-postgres`)
- **ODM:** Mongoose (MongoDB)
- **Cache/Messaging:** Redis (ioredis)

### Databases
- **Primary:** PostgreSQL 15
- **Telemetry:** MongoDB 6.0
- **Cache/Messaging:** Redis 7

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **API Documentation:** Swagger/OpenAPI
- **Validation:** Zod (Standard Schema)
- **Testing:** Vitest
- **Linting:** ESLint
- **Code Formatting:** Prettier

## 📁 Project Structure

```
biga-fleet-manager/
├── src/
│   ├── tenancy/              # Multi-tenancy
│   ├── fleet/                # Relational domain
│   ├── ingestion/            # Agnostic IoT gateway
│   ├── telemetry/            # Mongo + trip events
│   ├── platform/             # Prisma, Redis, Mongo, health, geo
│   └── app.module.ts
├── prisma/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd biga-fleet-manager
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```env
   # Database
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=biga_fleet
   DATABASE_URL="postgresql://user:password@localhost:5432/biga_fleet"
   
   # MongoDB
   MONGO_URL=mongodb://root:password@localhost:27017/biga_telemetry
   MONGO_ROOT_USER=root
   MONGO_ROOT_PASSWORD=password
   
   # Redis
   REDIS_URL=redis://localhost:6379
   REDIS_TELEMETRY_CHANNEL=vehicle_telemetry_stream
   ```

3. **Start infrastructure:**
   ```bash
   docker compose up -d
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Emit the Prisma contract:**
   ```bash
   npx prisma contract emit
   ```

6. **Apply schema to Postgres (empty DB):**
   ```bash
   npx prisma db init
   npm run db:seed
   ```

   If the database already has the Prisma 7 tables, skip `db init` and run `npx prisma db sign` after reviewing `prisma db verify`.

7. **Start the application:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:2342` and documentation at `http://localhost:2342/api/docs`.

## 📡 API Usage

### Telemetry Ingestion
Send GPS telemetry data via POST to `/telemetry/ingest`:

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "deviceId": "vehicle-uuid",
  "lat": -23.550520,
  "lng": -46.633308,
  "speed": 45.5,
  "ignition": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Relational fleet routes require header `x-tenant-id` (or `x-tenant-slug`).

### Fleet Management
- `GET /vehicles` - List vehicles in the tenant
- `POST /vehicles` - Create vehicle
- `GET /fleet/overview` - Fleet dashboard metrics
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /tenants` - List tenants
- `GET /trips/active` - List active trips

## 🧪 Testing & Development

### Running Tests
```bash
# Unit tests
npm run test
```

### Development Scripts
```bash
# Start with hot reload
npm run start:dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Telemetry Simulation
Use the included simulator to test telemetry ingestion:
```bash
node simulator.js
```

### Monitoring
Monitor system health and telemetry flow:
```bash
node monitor.js
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `MONGO_URL`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `REDIS_TELEMETRY_CHANNEL`: Pub/Sub channel for telemetry

### Database Schema
The system uses four main entities:
- **Tenants:** Organizations (locadoras) isolated by `x-tenant-id`
- **Companies:** Fleet owners, contractors, and maintenance providers (scoped by tenant)
- **Vehicles:** Individual vehicles with ownership relationships (scoped by tenant)
- **Trips:** Journey records with automatic lifecycle management (scoped by tenant)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for API changes
- Use conventional commits
- Ensure all tests pass before submitting PR

## 📄 License

This project is proprietary software. All rights reserved.

## 👤 Author

**Rick Alvim** - *Initial work*

## 🙏 Acknowledgments

- Built with NestJS framework
- Inspired by modern fleet management systems
- Designed for high-performance telemetry processing
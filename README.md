# 🐎 Biga Fleet Manager

A real-time asset tracking and fleet management system built with **Polyglot Persistence** architecture and asynchronous processing. Designed to handle high-volume telemetry ingestion while maintaining business data consistency.

## 📋 Overview

Biga Fleet Manager is a comprehensive fleet management solution specifically designed for managing Roman chariot ("biga") fleets. The system provides real-time tracking, telemetry processing, geolocation services, and automated trip lifecycle management. Built with modern microservices architecture and polyglot persistence to ensure scalability, reliability, and performance.

## 🏗️ Architecture & Technical Decisions

The project is architected to support high-volume telemetry ingestion without compromising business data consistency. It employs a sophisticated data strategy that leverages the strengths of different database technologies.

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
- **Fleet Management:** CRUD operations for chariots, companies, and fleet assignments
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
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **ODM:** Mongoose (MongoDB)
- **Cache/Messaging:** Redis (ioredis)

### Databases
- **Primary:** PostgreSQL 15
- **Telemetry:** MongoDB 6.0
- **Cache/Messaging:** Redis 7

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **API Documentation:** Swagger/OpenAPI
- **Validation:** class-validator & class-transformer
- **Testing:** Jest
- **Linting:** ESLint
- **Code Formatting:** Prettier

## 📁 Project Structure

```
biga-fleet-manager/
├── src/
│   ├── modules/
│   │   ├── company/          # Company management
│   │   ├── fleet/            # Fleet operations
│   │   ├── gateway/          # Telemetry ingestion
│   │   ├── telemetry/        # Telemetry processing
│   │   ├── trip/             # Trip management
│   │   ├── health/           # Health checks
│   │   └── maintenance/      # Maintenance module
│   ├── shared/
│   │   ├── infrastructure/   # Database & Redis setup
│   │   └── utils/            # Utilities (geocoding, maps)
│   └── app.module.ts         # Main application module
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts              # Database seeding
│   └── migrations/          # Database migrations
├── test/                    # End-to-end tests
├── monitor.js               # Monitoring utilities
├── simulator.js             # Telemetry simulator
├── Dockerfile               # Container definition
├── docker-compose.yml       # Multi-container setup
└── package.json             # Dependencies & scripts
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
   REDIS_TELEMETRY_CHANNEL=biga_telemetry_stream
   ```

3. **Start infrastructure:**
   ```bash
   docker compose up -d
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

7. **Start the application:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:2342` and documentation at `http://localhost:2342/api`.

## 📡 API Usage

### Telemetry Ingestion
Send GPS telemetry data via POST to `/telemetry/ingest`:

```json
{
  "chariotId": "chariot-uuid",
  "latitude": -23.550520,
  "longitude": -46.633308,
  "speed": 45.5,
  "ignition": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Fleet Management
- `GET /fleet` - List all chariots
- `POST /fleet` - Create new chariot
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /trips` - List trips

## 🧪 Testing & Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
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
The system uses three main entities:
- **Companies:** Fleet owners, contractors, and maintenance providers
- **Chariots:** Individual vehicles with ownership relationships
- **Trips:** Journey records with automatic lifecycle management

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
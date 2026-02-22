# 🐎 Biga Fleet Manager

Sistema de rastreamento e gestão de ativos em tempo real utilizando arquitetura de **Persistência Poliglota** e processamento assíncrono.

## 🏛️ Arquitetura e Decisões Técnicas

O projeto foi desenhado para suportar alta carga de ingestão de telemetria sem sacrificar a consistência dos dados de negócio.

### 💾 Estratégia de Dados (Poliglota)
- **PostgreSQL (Prisma):** Utilizado para dados transacionais (ACID). Gerencia frotas, motoristas e o ciclo de vida das viagens (Trips).
- **MongoDB (Mongoose):** Banco de séries temporais para telemetria. Armazena o rastro de GPS de forma escalável e eficiente para leitura de grandes volumes.
- **Redis (ioredis):** Camada de mensageria (Pub/Sub) para ingestão assíncrona e **Cache de Georeverse**. Coordenadas são transformadas em endereços reais e cacheadas para reduzir latência e custos de APIs externas (Nominatim/Google).

### 🛠️ Diferenciais de Implementação
- **Georeverse Inteligente:** Cache de endereços baseado em precisão geográfica no Redis.
- **Event-Driven Lifecycle:** O encerramento de viagens é detectado via sinal de ignição no payload de telemetria, disparando automaticamente a reconstituição da rota e o cálculo de distância.
- **Dockerized Environment:** Stack completa rodando em containers (Node.js, Postgres, Mongo, Redis).

## 🚀 Como Executar

1. Suba a infraestrutura:
   ```bash
   docker compose up -d
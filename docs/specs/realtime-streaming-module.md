# Specification: Real-Time Streaming & Live Telemetry Module (Tempo Real e Mapas ao Vivo)

## 1. Visão Geral
O **RealtimeStreamingModule** é o subsistema responsável por expor o fluxo contínuo de telemetria e eventos de frota diretamente para o front-end em tempo real. Ele substitui o modelo tradicional de polling por uma arquitetura orientada a eventos utilizando **Server-Sent Events (SSE)** conectados ao barramento Redis Streams/PubSub.

## 2. Regras de Negócio e Domínio
* **Isolamento por Tenant:** Toda conexão de stream deve validar obrigatoriamente o `tenantId` do cliente, garantindo que um operador só visualize os veículos da sua própria frota.
* **Agregação e Throttle de Posições:** Para evitar a saturação de largura de banda e processamento no navegador durante picos de ingestão IoT (50.000 pacotes/s), o gateway aplica um limite de taxa (*throttle*) por veículo (ex: enviar nova posição geográfica a cada 3 segundos por ativo, exceto se houver transição crítica como mudança de ignição ou alerta de cerca virtual).
* **Eventos Transmitidos:**
  * `vehicle.position.updated`: Coordenada atualizada, velocidade, rumo (*heading* 0-360º), status de ignição e timestamp.
  * `trip.status.changed`: Disparo imediato quando uma viagem inicia ou encerra.
  * `geofence.alert`: Notificação instantânea de entrada/saída de cercas virtuais (POIs).

## 3. Contratos de Conexão (Endpoints)

### 3.1. Stream Reativo de Telemetria (SSE)
* **Método:** `GET /api/v1/stream/telemetry`
* **Headers:** `x-tenant-id: <uuid>` (ou query param `tenantId=<uuid>`)
* **Content-Type:** `text/event-stream`
* **Payload de Transmissão (Exemplo de Evento SSE):**
  ```json
  {
    "event": "vehicle.position.updated",
    "tenantId": "00000000-0000-4000-8000-000000000001",
    "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
    "data": {
      "latitude": -22.6582,
      "longitude": -50.4183,
      "speed": 72.0,
      "heading": 145.5,
      "ignition": true,
      "timestamp": "2026-09-13T01:10:00.000Z"
    }
  }
  ```

### 3.2. Publicação Interna / Injeção de Eventos
* **Método:** `POST /api/v1/stream/events/publish`
* **Payload:** Objeto tipado de evento para injeção no barramento de tempo real.

## 4. Diretrizes de Implementação
* **Gateway Dedicado:** Adaptador SSE no NestJS utilizando `@Sse()` e RxJS `Observable<MessageEvent>`, com multiplexação por `tenantId` e filtragem por ativo.
* **Componente de Visualização:** Interface no frontend React (`LiveFleetMap.tsx`) com renderização em tempo real de marcadores animados por heading, velocímetro e feed lateral de alertas.
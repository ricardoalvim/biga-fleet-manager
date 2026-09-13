# Specification: Trip Module (Módulo de Viagens e Operação)

## 1. Visão Geral
O **TripModule** é o componente responsável pelo ciclo de vida operacional de viagens e deslocamentos da frota no **Biga Fleet Manager**. Ele registra o início e encerramento de percursos, gerencia o estado da ignição do veículo, calcula distâncias percorridas a partir dos dados de telemetria IoT e correlaciona pontos geoespaciais com endereços legíveis via geocodificação reversa. Todo o módulo opera sob isolamento estrito de múltiplos inquilinos (`tenantId`).

---

## 2. Regras de Negócio e Domínio

### 2.1. Abertura de Viagem (`startTrip`)
- Um veículo só pode iniciar uma viagem se existir e pertencer ao mesmo `tenantId` informado na requisição ou no header `x-tenant-id`. Caso contrário, é lançada exceção `NotFoundException` (`404 Not Found`, código `FLEET-0007`).
- O sistema define o horário de início (`startedAt`) como o instante atual e inicializa a ignição como ativa (`ignition: true`).
- **Idempotência:** Caso o veículo já possua uma viagem ativa em andamento (`endedAt: null`), a operação retorna a viagem ativa existente, evitando duplicações geradas por disparos contínuos de rastreadores IoT.
- Emite de forma assíncrona o evento `TRIP_STARTED` através do Redis Pub/Sub (`trip_events_stream`).

### 2.2. Encerramento de Viagem (`finishTrip`)
- Ao encerrar a viagem, o sistema registra o horário de término (`endedAt`) e define o estado da ignição como desligada (`ignition: false`).
- **Validação de Existência e Tenant:** Caso a viagem não exista para o `tenantId`, o sistema retorna `NotFoundException` (`404 Not Found`, código `FLEET-0003`).
- **Prevenção de Encerramento Duplicado:** Tentativas de encerrar uma viagem cujo `endedAt` já esteja preenchido disparam `ConflictException` (`409 Conflict`, código `FLEET-0004: Viagem já foi encerrada anteriormente`).
- **Cálculo de Distância (Odômetro):**
  - O sistema busca os pontos de telemetria coletados no MongoDB associados ao `tripId`, ordenados cronologicamente (`timestamp: 1`).
  - A distância total percorrida (`distanceKm`) é computada entre pontos consecutivos utilizando a fórmula de Haversine (`MapUtils.getDistance`).
  - Para viagens com menos de 2 pontos de telemetria, a distância é registrada como `0.00 km`.
- Emite de forma assíncrona o evento `TRIP_FINISHED` com a distância total percorrida no Redis Pub/Sub (`trip_events_stream`).

### 2.3. Relatório de Viagem e Performance (`getTripReport`)
- Consolida a rota completa da viagem a partir dos pontos de telemetria gravados.
- Cada ponto de coordenada é enriquecido com endereço legível através do serviço de geocodificação reversa (`GeocodingService`), com fallback resiliente para coordenadas brutas em caso de instabilidade na API externa.
- Fornece métricas estatísticas essenciais:
  - `distanceKm`: Distância percorrida em quilômetros.
  - `avgSpeed`: Velocidade média registrada ao longo do percurso (km/h).
  - `pointCount`: Quantidade total de pontos de telemetria registrados na viagem.
  - `startAddress` e `endAddress`: Endereços dos pontos inicial e final da rota.

### 2.4. Integrações Externas e Eventos Assíncronos
- **Canal Redis:** `trip_events_stream` (ou configurável via `REDIS_TRIP_CHANNEL`).
- **Eventos:**
  - `TRIP_STARTED`: `{ "event": "TRIP_STARTED", "tripId": "...", "tenantId": "...", "vehicleId": "...", "startedAt": "..." }`
  - `TRIP_FINISHED`: `{ "event": "TRIP_FINISHED", "tripId": "...", "tenantId": "...", "vehicleId": "...", "endedAt": "...", "distanceKm": 15.5 }`
- As notificações externas são não-bloqueantes: falhas no broker Redis registram advertência em log (`Logger.warn`) sem interromper a integridade da transação.

---

## 3. Contratos de API (Endpoints)

### 3.1. Iniciar Viagem
* **Método:** `POST /trips/start`
* **Headers:** `x-tenant-id` (obrigatório)
* **Payload (JSON):**
  ```json
  {
    "vehicleId": "00000000-0000-4000-8000-000000000002",
    "tenantId": "00000000-0000-4000-8000-000000000001"
  }
  ```
* **Respostas:**
  * `201 Created`: Viagem iniciada com sucesso (ou viagem ativa existente retornada).
  * `400 Bad Request`: Payload com formato UUID inválido.
  * `404 Not Found`: Veículo não encontrado para o tenant (`FLEET-0007`).

### 3.2. Finalizar Viagem
* **Método:** `PATCH /trips/:id/finish`
* **Headers:** `x-tenant-id` (obrigatório)
* **Parâmetros de Rota:** `:id` (UUID da viagem)
* **Respostas:**
  * `200 OK`: Viagem finalizada, odômetro calculado e ignição desligada.
  * `404 Not Found`: Viagem não localizada no tenant (`FLEET-0003`).
  * `409 Conflict`: Viagem já encerrada previamente (`FLEET-0004`).

### 3.3. Listar Viagens Ativas
* **Método:** `GET /trips/active`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Lista de viagens em andamento (`endedAt: null`) ordenadas pela data de início descendente.

### 3.4. Consultar Viagem por ID
* **Método:** `GET /trips/:id`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Detalhes da viagem e resumo do veículo (`plate`, `model`).
  * `404 Not Found`: Viagem não encontrada no tenant (`FLEET-0003`).

### 3.5. Relatório e Rastro da Viagem
* **Método:** `GET /trips/:id/report`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`:
    ```json
    {
      "id": "uuid-da-viagem",
      "vehiclePlate": "ROM1001",
      "startAddress": "Praça da Sé, São Paulo, SP",
      "endAddress": "Av. Paulista, 1000, São Paulo, SP",
      "stats": {
        "distanceKm": 12.45,
        "avgSpeed": 48.2,
        "pointCount": 85
      },
      "route": [
        {
          "lat": -23.55052,
          "lng": -46.633308,
          "speed": 42.0,
          "time": "2026-09-12T10:00:00.000Z",
          "address": "Praça da Sé, São Paulo, SP"
        }
      ]
    }
    ```
  * `404 Not Found`: Viagem inexistente (`FLEET-0003`).

---

## 4. Códigos de Erro Padronizados

| Código | HTTP Status | Descrição |
|---|---|---|
| `FLEET-0003` | 404 Not Found | Viagem não encontrada no tenant informado |
| `FLEET-0004` | 409 Conflict | Viagem já foi encerrada anteriormente |
| `FLEET-0007` | 404 Not Found | Veículo não encontrado no tenant informado |
# Specification: Route Planning & Contextual Fleet Module (Planejamento de Rotas e Parametrização Multi-Contexto)

## 1. Visão Geral
O **`RoutePlanningModule`** é o motor de inteligência geoespacial e operacional do **Biga Fleet Manager**. Diferente de roteadores tradicionais, ele foi arquitetado desde a raiz para suportar **parametrização multi-contexto**, permitindo que a mesma plataforma se adapte dinamicamente a diferentes verticais de negócio:
* **Entregas Urbanas / Vans (`DELIVERY`):** Foco em densidade de paradas urbanas, janelas de entrega e restrições de tráfego central.
* **Transporte de Passageiros / Ônibus (`PASSENGER`):** Foco em cumprimento de itinerários, paradas pré-determinadas (terminais/estações) e regularidade operacional.
* **Logística Pesada / Caminhões (`HEAVY_CARGO`):** Foco em limites severos de peso por eixo, altura de viadutos, raio de giro e cálculo de custos de combustível/pedágio.
* **Operações de Campo / Agrícola (`AGRICULTURAL`):** Foco em circulação em talhões e estradas não pavimentadas (*off-road*), deslocamento entre fazendas/silos e baixas velocidades operacionais.

O módulo customiza a terminologia operacional por contexto e aplica restrições físicas e geotécnicas antes do cálculo do traçado da rota.

---

## 2. Regras de Negócio e Domínio

### 2.1. Contextualização Dinâmica por Vertical (`BusinessContext`)
O sistema aceita parâmetros de customização de vocabulário e regras físicas baseados no tipo de frota:
1. **`DELIVERY`**:
   - Vocabulário padrão sugerido: Parada de Entrega (`stopPointLabel`), Van/Utilitário (`assetLabel`), Rota de Distribuição (`routeLabel`).
   - Velocidade média padrão: 50 km/h (limitada por `maxSpeedKmh`).
   - Taxa média de combustível: 0.12 L/km (~8.3 km/L).
2. **`PASSENGER`**:
   - Vocabulário padrão sugerido: Ponto/Terminal (`stopPointLabel`), Ônibus/Van de Passageiros (`assetLabel`), Linha/Itinerário (`routeLabel`).
   - Velocidade média padrão: 60 km/h (limitada por `maxSpeedKmh`).
   - Taxa média de combustível: 0.28 L/km (~3.6 km/L).
3. **`HEAVY_CARGO`**:
   - Vocabulário padrão sugerido: Centro de Distribuição/Pátio (`stopPointLabel`), Cavalo Mecânico/Carreta (`assetLabel`), Viagem Rodoviária (`routeLabel`).
   - Velocidade média padrão: 55 km/h (limitada por `maxSpeedKmh`).
   - Taxa média de combustível: 0.42 L/km (~2.4 km/L).
4. **`AGRICULTURAL`**:
   - Vocabulário padrão sugerido: Talhão/Fazenda (`stopPointLabel`), Colheitadeira/Trator (`assetLabel`), Deslocamento de Campo (`routeLabel`).
   - Velocidade média padrão: 25 km/h (limitada por `maxSpeedKmh`).
   - Taxa média de combustível: 0.65 L/km (~1.5 km/L).

### 2.2. Restrições Físicas e Geotécnicas (`PhysicalConstraints`)
* **`maxWeightTons`**: Peso bruto total máximo permitido (rejeita valores negativos).
* **`maxHeightMeters`**: Altura máxima do veículo em metros (rejeita valores negativos).
* **`allowUnpavedRoads`**: Permissão explícita para tráfego em vias de terra/cascalho (essencial para o contexto `AGRICULTURAL`).
* **`maxSpeedKmh`**: Limite físico/operacional de velocidade (> 0 km/h).

### 2.3. Motor de Roteirização e Projeção Operacional
* **Cálculo de Distância Geodésica Acumulada:**
  - Utiliza a fórmula de Haversine via `MapUtils.getDistance` conectando ordenadamente:
    $$\text{Origem} \rightarrow \text{Waypoint}_1 \rightarrow \text{Waypoint}_2 \rightarrow \dots \rightarrow \text{Destino}$$
* **Estimativa de Duração:**
  - $\text{Duração (min)} = \left(\frac{\text{distanciaKm}}{\text{velocidadeEfetiva}}\right) \times 60$, onde $\text{velocidadeEfetiva} = \min(\text{maxSpeedKmh}, \text{velocidadeMediaContexto})$.
* **Projeção de Combustível:**
  - $\text{Combustível (L)} = \text{distanciaKm} \times \text{taxaConsumoContexto}$.

### 2.4. Ciclo de Vida da Rota (`PlannedRouteStatus`)
* `PLANNED`: Rota calculada e gravada no sistema.
* `DISPATCHED`: Rota enviada para o terminal do motorista / tablet de bordo. Registra `dispatchedAt = new Date()`.
* `IN_PROGRESS`: Veículo iniciou a telemetria ao longo da rota.
* `COMPLETED`: Todos os waypoints e o destino foram alcançados.
* `CANCELLED`: Despacho cancelado pelo gestor operacional.

---

## 3. Contratos de API (Endpoints REST)

Headers obrigatórios em todas as requisições:
* `x-tenant-id`: UUID v4 do Tenant proprietário da frota.

### 3.1. Criar Perfil de Rota Contextualizado
* **Método:** `POST /api/v1/route-profiles`
* **Payload (JSON):**
  ```json
  {
    "name": "Perfil Operacional - Safra Agrícola",
    "businessContext": "AGRICULTURAL",
    "customTerminology": {
      "stopPointLabel": "Talhão/Fazenda",
      "assetLabel": "Colheitadeira/Trator",
      "routeLabel": "Deslocamento de Campo"
    },
    "physicalConstraints": {
      "maxWeightTons": 24.5,
      "maxHeightMeters": 4.2,
      "allowUnpavedRoads": true,
      "maxSpeedKmh": 40.0
    }
  }
  ```
* **Respostas:**
  - `201 Created`: Perfil contextual criado com sucesso.
  - `400 Bad Request`: Parâmetros de restrição inválidos (velocidade $\le 0$, peso $< 0$, etc.).

### 3.2. Listar Perfis de Rota
* **Método:** `GET /api/v1/route-profiles`
* **Query Params:**
  - `businessContext`: Opcional (`DELIVERY`, `PASSENGER`, `HEAVY_CARGO`, `AGRICULTURAL`).
* **Respostas:**
  - `200 OK`: Lista imutável de perfis de rota ordenados por criação.

### 3.3. Consultar Perfil de Rota por ID
* **Método:** `GET /api/v1/route-profiles/:id`
* **Respostas:**
  - `200 OK`: Detalhes do perfil.
  - `404 Not Found`: Perfil não encontrado (`FLEET-0015`).

### 3.4. Calcular e Planejar Rota Otimizada
* **Método:** `POST /api/v1/routes/calculate`
* **Payload (JSON):**
  ```json
  {
    "profileId": "c3d4e5f6-a7b8-9012-abcd-ef0123456789",
    "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
    "origin": {
      "latitude": -22.6582,
      "longitude": -50.4183,
      "address": "Fazenda Modelo"
    },
    "destination": {
      "latitude": -22.7100,
      "longitude": -50.5000,
      "address": "Silo de Grãos Central"
    },
    "waypoints": [
      {
        "latitude": -22.6800,
        "longitude": -50.4500,
        "sequence": 1,
        "address": "Talhão 03"
      }
    ]
  }
  ```
* **Respostas:**
  - `200 OK`: Retorna rota calculada com `distanceKm`, `estimatedDurationMinutes`, `projectedFuelLiters`, `status: "PLANNED"`, e sumários de veículo e perfil.
  - `400 Bad Request`: Coordenadas fora da faixa válida ($-90 \le \text{lat} \le 90$, $-180 \le \text{lng} \le 180$).
  - `404 Not Found`: Veículo (`FLEET-0007`) ou Perfil (`FLEET-0015`) não encontrado no tenant.

### 3.5. Listar Rotas Planejadas
* **Método:** `GET /api/v1/routes`
* **Query Params:**
  - `vehicleId`: Filtrar por UUID do veículo.
  - `profileId`: Filtrar por UUID do perfil.
  - `status`: Filtrar por status (`PLANNED`, `DISPATCHED`, `IN_PROGRESS`, etc.).
* **Respostas:**
  - `200 OK`: Lista de rotas planejadas com métricas consolidadas.

### 3.6. Consultar Rota Planejada por ID
* **Método:** `GET /api/v1/routes/:id`
* **Respostas:**
  - `200 OK`: Detalhes completos da rota incluindo waypoints e enriquecimento.
  - `404 Not Found`: Rota não encontrada no tenant (`FLEET-0016`).

### 3.7. Despachar Rota para Operação
* **Método:** `PATCH /api/v1/routes/:id/dispatch`
* **Respostas:**
  - `200 OK`: Rota despachada (`status: "DISPATCHED"`, `dispatchedAt: ISO-Date`).
  - `404 Not Found`: Rota não encontrada (`FLEET-0016`).
  - `409 Conflict`: Rota já foi despachada anteriormente (`FLEET-0017`).

---

## 4. Tabela de Códigos de Erro de Negócio

| Código de Erro | HTTP Status | Descrição |
| :--- | :--- | :--- |
| `FLEET-0007` | 404 Not Found | Veículo não encontrado para o tenant informado |
| `FLEET-0015` | 404 Not Found | Perfil de rota não encontrado para o tenant informado |
| `FLEET-0016` | 404 Not Found | Rota planejada não encontrada para o tenant informado |
| `FLEET-0017` | 409 Conflict | Rota já foi despachada ou finalizada |

---

## 5. Eventos Assíncronos no Redis (`route_planning_events_stream`)

1. **`ROUTE_CALCULATED`**:
   - Disparado imediatamente após a conclusão do cálculo da rota.
   - Payload: `{ event, routeId, tenantId, profileId, vehicleId, distanceKm, estimatedDurationMinutes, projectedFuelLiters, waypointsCount, createdAt }`.
2. **`ROUTE_DISPATCHED`**:
   - Disparado no despacho da rota para os navegadores e módulos telemáticos IoT de bordo.
   - Payload: `{ event, routeId, tenantId, profileId, vehicleId, distanceKm, estimatedDurationMinutes, status, dispatchedAt }`.

---

## 6. Arquitetura e Decisões de Implementação

* **Diretório:** `src/fleet/route-planning/`
* **Entidades Puras:** `RouteProfileEntity`, `PlannedRouteEntity` (isolamento de lógica de negócio e invariantes).
* **DTOs Internos em Estilo Record:** Propriedades `readonly` e chamada explícita de `Object.freeze(this)`.
* **DTOs Externos:** Zod schemas fortemente validados em tempo de execução.
* **Persistência Desacoplada:** `RoutePlanningRepository` operando sobre MongoDB/Mongoose (`route_profiles`, `planned_routes`) sem dependência direta do Prisma ORM e sem `any`.
* **Separação de Serviços:**
  - `RoutePlanningInternalService`: regras de negócio, cálculos Haversine, persistência e validações.
  - `RoutePlanningExternalService`: integração com `GeocodingService` e publicação resiliente em Redis.

---

## 7. Verificação e Testes Unitários (Vitest)

* **Arquivos de Teste do Módulo:**
  - `route-planning.internal.service.spec.ts`: 14 testes cobrindo validação de vocabulário, restrições físicas, cálculo geodésico Haversine, estimativas contextuais, tratamento de erros `FLEET-0007`, `FLEET-0015`, `FLEET-0016`, `FLEET-0017` e despacho.
  - `route-planning.external.service.spec.ts`: 6 testes cobrindo emissão de eventos Redis, geocodificação reversa e resiliência a desconexões do broker.
* **Status Geral da Suíte de Testes:**
  - **16 arquivos de teste** executados.
  - **109 testes aprovados (100% de sucesso)**.
  - Build NestJS compilado com código de saída 0 (`nest build`).
  - Linter ESLint 100% aprovado sem erros ou alertas (`npm run lint`).
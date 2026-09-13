# Specification: Incidents & Tolls Module (Sinistros, Ocorrências e Pedágios)

## 1. Visão Geral
O **IncidentsTollsModule** é o subsistema responsável por capturar eventos operacionais externos de alto impacto financeiro no **Biga Fleet Manager**. Ele gerencia o registro de infrações (multas), sinistros (acidentes/avarias) e a ingestão automatizada de passagens em praças de pedágio. O módulo é projetado nativamente para receber cargas via integração com provedores externos (APIs de concessionárias de rodovias, sistemas de TAGs e órgãos de trânsito), garantindo rastreabilidade por `tenantId`, vinculação com o ativo (`Vehicle`) e com a empresa parceira/custodiante responsável.

---

## 2. Regras de Negócio e Domínio

### 2.1. Ingestão Idempotente de Pedágios (`TollEvent`)
- Cada passagem em praça de pedágio possui um identificador externo único (`externalTransactionId`) emitido pela concessionária ou operadora de TAG.
- **Idempotência Estrita:** O sistema rejeita transações duplicadas para o mesmo tenant com `ConflictException` (`409 Conflict`, código `FLEET-0012`).
- Valida se o veículo existe e pertence ao mesmo `tenantId` informado (`NotFoundException` / `FLEET-0007`).
- O valor da tarifa (`amount`) deve ser maior ou igual a zero.
- Emite o evento assíncrono `TOLL_EVENT_REGISTERED` no canal Redis `toll_incident_events_stream`.

### 2.2. Registro e Rateio de Sinistros e Ocorrências (`Incident`)
- Registra eventos como acidentes, colisões, avarias, multas ou furtos (`incidentType: 'ACCIDENT' | 'FINE' | 'DAMAGE' | 'THEFT' | 'OTHER'`).
- **Vinculação de Responsabilidade:** Aponta a empresa parceira/custodiante (`responsibleCompanyId`) responsável no momento do fato para permitir auditoria, repasse e reembolso de custos.
- **Validações:**
  - O veículo deve pertencer ao mesmo tenant (`FLEET-0007`).
  - A empresa responsável deve pertencer ao mesmo tenant (`FLEET-0005`).
- Status inicial: `OPEN`.
- Emite o evento assíncrono `INCIDENT_REGISTERED` no canal Redis `toll_incident_events_stream`.

### 2.3. Liquidação de Ocorrências (`settleIncident`)
- Permite registrar o custo real definitivo apurado (`actualCost`) e concluir a ocorrência, alterando seu status para `SETTLED`.
- **Prevenção de Liquidação Duplicada:** Sinistros já liquidados não podem ser liquidados novamente (`ConflictException` / `FLEET-0014`).

### 2.4. Resumo Financeiro e Alimentação do TCO
- Consolida as despesas acumuladas do veículo através do endpoint `GET /api/v1/vehicles/:vehicleId/financial-summary`:
  - `totalTollAmount`: Somatório de todas as tarifas de pedágio registradas para o ativo.
  - `tollPassageCount`: Quantidade de passagens registradas.
  - `totalActualIncidentCost`: Custo total liquidado de sinistros (ou estimado para ordens abertas).
  - `incidentCount`: Total de ocorrências registradas para o ativo.
  - `totalCombinedCost`: Custo financeiro consolidado (`totalTollAmount + totalActualIncidentCost`).

---

## 3. Contratos de API (Endpoints)

### 3.1. Registrar Passagem em Pedágio (Integração / Webhook)
* **Método:** `POST /api/v1/tolls/events`
* **Headers:** `x-tenant-id` (obrigatório)
* **Payload (JSON Normalizado):**
  ```json
  {
    "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
    "tollPlazaName": "Concessionaria Rodovias do Tietê - Praca 04",
    "externalTransactionId": "TAG-998877665544",
    "amount": 14.80,
    "passedAt": "2026-09-12T20:15:00Z"
  }
  ```
* **Respostas:**
  * `201 Created`: Transação de pedágio registrada com sucesso.
  * `404 Not Found`: Veículo não encontrado no tenant (`FLEET-0007`).
  * `409 Conflict`: Transação duplicada para este tenant (`FLEET-0012`).

### 3.2. Listar Passagens em Pedágios
* **Método:** `GET /api/v1/tolls`
* **Headers:** `x-tenant-id` (obrigatório)
* **Query Params (opcionais):** `?vehicleId=...`
* **Respostas:**
  * `200 OK`: Lista de passagens ordenadas cronologicamente por `passedAt` descendente.

### 3.3. Registrar Sinistro ou Ocorrência
* **Método:** `POST /api/v1/incidents`
* **Headers:** `x-tenant-id` (obrigatório)
* **Payload (JSON Normalizado):**
  ```json
  {
    "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
    "responsibleCompanyId": "b2c3d4e5-f6a7-8901-abcd-ef0123456789",
    "incidentType": "ACCIDENT",
    "description": "Colisão traseira leve em trecho urbano",
    "estimatedCost": 3500.00,
    "occurredAt": "2026-09-12T14:30:00Z"
  }
  ```
* **Respostas:**
  * `201 Created`: Ocorrência registrada para auditoria e rateio.
  * `404 Not Found`: Veículo (`FLEET-0007`) ou empresa responsável (`FLEET-0005`) inexistente.

### 3.4. Listar Ocorrências e Sinistros
* **Método:** `GET /api/v1/incidents`
* **Headers:** `x-tenant-id` (obrigatório)
* **Query Params:**
  * `?vehicleId=...`: Filtrar por veículo
  * `?responsibleCompanyId=...`: Filtrar por empresa responsável
  * `?incidentType=ACCIDENT|FINE|DAMAGE|THEFT|OTHER`: Filtrar por tipo
  * `?status=OPEN|IN_REVIEW|SETTLED|CANCELLED`: Filtrar por status
* **Respostas:**
  * `200 OK`: Lista de ocorrências.

### 3.5. Consultar Ocorrência por ID
* **Método:** `GET /api/v1/incidents/:id`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Detalhes completos da ocorrência.
  * `404 Not Found`: Ocorrência não localizada (`FLEET-0013`).

### 3.6. Liquidar Sinistro / Ocorrência
* **Método:** `PATCH /api/v1/incidents/:id/settle`
* **Headers:** `x-tenant-id` (obrigatório)
* **Parâmetros de Rota:** `:id` (UUID do sinistro)
* **Payload (JSON):**
  ```json
  {
    "actualCost": 3200.00
  }
  ```
* **Respostas:**
  * `200 OK`: Ocorrência liquidada com sucesso (`status: SETTLED`).
  * `404 Not Found`: Ocorrência não localizada (`FLEET-0013`).
  * `409 Conflict`: Ocorrência já liquidada anteriormente (`FLEET-0014`).

### 3.7. Resumo Financeiro do Veículo (TCO)
* **Método:** `GET /api/v1/vehicles/:vehicleId/financial-summary`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`:
    ```json
    {
      "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
      "vehiclePlate": "ROM1001",
      "totalTollAmount": 148.50,
      "tollPassageCount": 10,
      "totalEstimatedIncidentCost": 3500.00,
      "totalActualIncidentCost": 3200.00,
      "incidentCount": 1,
      "totalCombinedCost": 3348.50
    }
    ```
  * `404 Not Found`: Veículo não encontrado (`FLEET-0007`).

---

## 4. Códigos de Erro Padronizados

| Código | HTTP Status | Descrição |
|---|---|---|
| `FLEET-0005` | 404 Not Found | Empresa parceira/responsável não encontrada no tenant |
| `FLEET-0007` | 404 Not Found | Veículo não encontrado no tenant informado |
| `FLEET-0012` | 409 Conflict | Transação de pedágio já registrada para este tenant (duplicidade) |
| `FLEET-0013` | 404 Not Found | Sinistro ou ocorrência não localizada no tenant |
| `FLEET-0014` | 409 Conflict | Ocorrência já foi liquidada anteriormente |
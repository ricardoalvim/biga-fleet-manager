# Specification: Maintenance Module (Planejamento, Execução e Custos de Manutenção)

## 1. Visão Geral
O **MaintenanceModule** gerencia o ciclo completo de manutenção da frota no **Biga Fleet Manager**. Ele atua em duas frentes complementares:
1. **Planejamento Preditivo:** Parametrização de planos de revisão por marcos de quilometragem (`triggerKm`) com checklists granulares de itens (`INSPECTION` vs `REPLACEMENT`), sugerindo intervenções com base na rodagem dos veículos.
2. **Execução e Custos de O.S.:** Gestão detalhada de Ordens de Serviço (`MaintenanceOrder`) discriminando item a item peças (`partCost`), mão de obra (`laborCost`) e o impacto financeiro da ociosidade na oficina (`downtimeCost`), consolidando o custo total de posse e operação dos ativos.

---

## 2. Regras de Negócio e Domínio

### 2.1. Planejamento de Manutenção (`MaintenancePlan`)
- Planos definem marcos operacionais de quilometragem (`triggerKm`, ex: a cada 10.000 km, 20.000 km).
- Cada plano possui um checklist obrigatório de itens, indicando o tipo de intervenção:
  - `INSPECTION`: Inspeção, aferição, diagnóstico ou ajuste sem troca de componente.
  - `REPLACEMENT`: Substituição física de peça ou fluído (óleo, filtros, pastilhas, correias).

### 2.2. Motor Preditivo de Sugestões por Rodagem
- O sistema cruza a quilometragem atual do veículo (calculada a partir da soma de distâncias das viagens concluídas ou fornecida via telemetria) com os planos cadastrados para o tenant.
- Cada plano gera um diagnóstico classificado em:
  - `DUE`: O veículo atingiu a quilometragem recomendada (dentro de margem de 1.000 km) e requer intervenção imediata.
  - `OVERDUE`: O veículo ultrapassou em mais de 1.000 km a quilometragem recomendada do plano.
  - `UPCOMING`: A intervenção está programada para o futuro (quilometragem ainda não atingida).

### 2.3. Abertura de Ordem de Serviço (`createOrder`)
- A O.S. vincula obrigatoriamente um veículo (`vehicleId`) e uma oficina/prestador (`providerId`) pertencentes ao mesmo `tenantId`.
- **Validações:**
  - O veículo deve existir no tenant (`NotFoundException` / `FLEET-0007`).
  - O prestador deve existir no tenant (`NotFoundException` / `FLEET-0005`) e ser categorizado obrigatoriamente como empresa do tipo `MAINTENANCE` (`BadRequestException` / `FLEET-0009`).
- Status inicial da O.S.: `OPEN`.
- Tipo da ordem: `PREVENTIVE` (preventiva) ou `CORRECTIVE` (corretiva).
- Emite o evento assíncrono `MAINTENANCE_ORDER_CREATED` no canal Redis `maintenance_events_stream`.

### 2.4. Apontamento Granular e Conclusão de O.S. (`completeOrder`)
- A O.S. deve estar no status `OPEN` ou `IN_PROGRESS`. Tentativas de concluir uma ordem já no status `COMPLETED` disparam `ConflictException` (`FLEET-0011`).
- **Composição de Custos:**
  - **Peças (`totalPartsCost`):** Somatório de `partCost` de todos os itens executados.
  - **Mão de Obra (`totalLaborCost`):** Somatório de `laborCost` de todos os itens executados.
  - **Indisponibilidade (`totalDowntimeCost`):** `downtimeHours * downtimeCostPerHour`.
  - **Custo Total da O.S. (`totalCost`):** `totalPartsCost + totalLaborCost + totalDowntimeCost`.
- A ordem é marcada como `COMPLETED`, com o registro do timestamp de conclusão (`completedAt`).
- Emite o evento assíncrono `MAINTENANCE_ORDER_COMPLETED` no canal Redis `maintenance_events_stream`.

---

## 3. Contratos de API (Endpoints)

### 3.1. Cadastrar Plano de Manutenção
* **Método:** `POST /maintenances/plans`
* **Headers:** `x-tenant-id` (obrigatório)
* **Payload (JSON):**
  ```json
  {
    "name": "Plano Padrão Revisão 10k",
    "triggerKm": 10000,
    "items": [
      { "description": "Troca de Óleo do Motor 5W30", "action": "REPLACEMENT" },
      { "description": "Verificação de Pastilhas de Freio", "action": "INSPECTION" }
    ]
  }
  ```
* **Respostas:**
  * `201 Created`: Plano registrado com sucesso.
  * `400 Bad Request`: Payload com parâmetros inválidos ou sem itens.

### 3.2. Listar Planos de Manutenção
* **Método:** `GET /maintenances/plans`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Lista de planos cadastrados para o tenant, ordenados por `triggerKm` ascendente.

### 3.3. Abrir Ordem de Serviço
* **Método:** `POST /maintenances/orders`
* **Headers:** `x-tenant-id` (obrigatório)
* **Payload (JSON):**
  ```json
  {
    "vehicleId": "00000000-0000-4000-8000-000000000002",
    "providerId": "00000000-0000-4000-8000-000000000003",
    "type": "PREVENTIVE",
    "scheduledDate": "2026-09-20T08:00:00Z"
  }
  ```
* **Respostas:**
  * `201 Created`: Ordem de serviço aberta com sucesso (`status: OPEN`).
  * `400 Bad Request`: Prestador não pertence ao tipo `MAINTENANCE` (`FLEET-0009`).
  * `404 Not Found`: Veículo (`FLEET-0007`) ou prestador (`FLEET-0005`) inexistente.

### 3.4. Apontar Execução e Concluir O.S.
* **Método:** `PATCH /maintenances/orders/:id/complete`
* **Headers:** `x-tenant-id` (obrigatório)
* **Parâmetros de Rota:** `:id` (Identificador da O.S.)
* **Payload (JSON):**
  ```json
  {
    "downtimeHours": 14.5,
    "downtimeCostPerHour": 80.00,
    "executedItems": [
      {
        "description": "Troca de Óleo 5W30",
        "action": "REPLACEMENT",
        "partCost": 250.00,
        "laborCost": 100.00
      },
      {
        "description": "Inspeção de Suspensão Dianteira",
        "action": "INSPECTION",
        "partCost": 0.00,
        "laborCost": 150.00
      }
    ]
  }
  ```
* **Respostas:**
  * `200 OK`: Ordem concluída com custos agregados calculados.
  * `404 Not Found`: Ordem de serviço não encontrada (`FLEET-0010`).
  * `409 Conflict`: Ordem já foi concluída anteriormente (`FLEET-0011`).

### 3.5. Listar Ordens de Serviço
* **Método:** `GET /maintenances/orders`
* **Headers:** `x-tenant-id` (obrigatório)
* **Query Params:**
  * `?vehicleId=...`: Filtrar por veículo
  * `?providerId=...`: Filtrar por prestador
  * `?status=OPEN|COMPLETED`: Filtrar por status
* **Respostas:**
  * `200 OK`: Lista de ordens de serviço.

### 3.6. Consultar Ordem de Serviço por ID
* **Método:** `GET /maintenances/orders/:id`
* **Headers:** `x-tenant-id` (obrigatório)
* **Respostas:**
  * `200 OK`: Detalhes completos da ordem de serviço.
  * `404 Not Found`: Ordem de serviço não encontrada (`FLEET-0010`).

### 3.7. Sugestões Preditivas por Rodagem
* **Método:** `GET /maintenances/vehicles/:vehicleId/suggestions`
* **Headers:** `x-tenant-id` (obrigatório)
* **Query Params (opcional):** `?currentKm=10500` (sobrescreve cálculo automático de odômetro)
* **Respostas:**
  * `200 OK`:
    ```json
    {
      "vehicleId": "00000000-0000-4000-8000-000000000002",
      "vehiclePlate": "ROM1001",
      "currentKm": 10500,
      "suggestions": [
        {
          "planId": "66e2c...",
          "planName": "Revisão 10.000 km",
          "triggerKm": 10000,
          "currentKm": 10500,
          "kmDifference": 500,
          "status": "DUE",
          "items": [
            { "description": "Troca de Óleo", "action": "REPLACEMENT" }
          ]
        }
      ]
    }
    ```
  * `404 Not Found`: Veículo não encontrado (`FLEET-0007`).

---

## 4. Códigos de Erro Padronizados

| Código | HTTP Status | Descrição |
|---|---|---|
| `FLEET-0005` | 404 Not Found | Empresa parceira/prestadora não encontrada no tenant |
| `FLEET-0007` | 404 Not Found | Veículo não encontrado no tenant informado |
| `FLEET-0009` | 400 Bad Request | A empresa prestadora da O.S. deve ser do tipo MAINTENANCE |
| `FLEET-0010` | 404 Not Found | Ordem de serviço não encontrada no tenant |
| `FLEET-0011` | 409 Conflict | A ordem de serviço já foi concluída anteriormente |
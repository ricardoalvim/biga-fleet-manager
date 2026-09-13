# Specification: TCO & ROI Analytics Module (Inteligência Financeira e Custo Total de Propriedade)

## 1. Visão Geral
O **TcoRoiAnalyticsModule** é o ápice analítico do **Biga Fleet Manager**. Ele consolida todos os dados transacionais e operacionais gerados nos demais módulos (manutenções granulares, passagens em pedágio, sinistros, consumo de combustível via telemetria e depreciação de ativos) para calcular em tempo real o **TCO (Total Cost of Ownership / Custo Total de Propriedade)** e o **ROI (Return on Investment)** por veículo, frota ou centro de custo, respeitando estritamente o isolamento por `tenantId`.

## 2. Regras de Domínio e Composição de Custos
* **Fatores de Custo Agregados (O Ecossistema):**
  * **Custos Diretos de Manutenção:** Somatório de peças, mão de obra e custo de indisponibilidade (`downtimeCost`) vindos do `MaintenanceModule`.
  * **Custos Operacionais de Via:** Pedágios e multas consolidados pelo `IncidentsTollsModule`.
  * **Consumo de Combustível / Energia:** Cruza a quilometragem e o tempo de ignição da telemetria com a eficiência energética estimada pelo contexto do veículo.
  * **Depreciação e Custos Fixos:** Base de cálculo baseada na idade do ativo e valor de aquisição vinculado ao proprietário (`ownerId`).
* **Normalização para Integrações Externas (ERP/BI):**
  * Expõe contratos normalizados e sem espaçamentos indevidos para alimentar ferramentas de Business Intelligence (PowerBI, Tableau) ou sistemas ERP financeiros corporativos.

## 3. Contratos de API (Endpoints)

### 3.1. Consultar Relatório Consolidado de TCO por Veículo
* **Método:** `GET /api/v1/analytics/vehicles/:vehicleId/tco`
* **Query Params Opcionais:** `startDate`, `endDate`
* **Respostas:**
  * `200 OK`: Retorna o demonstrativo financeiro detalhado do ativo.
  * Exemplo de Payload de Retorno (JSON Normalizado):
    ```json
    {
      "tenantId":"a1b2c3d4-e5f6-7890-abcd-ef0123456789",
      "vehicleId":"f1e2d3c4-b5a6-7890-abcd-ef0123456789",
      "period":{
        "startDate":"2026-01-01T00:00:00Z",
        "endDate":"2026-09-12T23:59:59Z"
      },
      "costs":{
        "maintenanceTotal":4500.00,
        "tollsTotal":850.50,
        "fuelTotal":12400.00,
        "incidentsTotal":3500.00,
        "depreciationTotal":6000.00
      },
      "summary":{
        "totalCostOfOwnership":27250.50,
        "totalDistanceKm":45200.0,
        "costPerKm":0.60
      }
    }
    ```
  * `404 Not Found`: Veículo não localizado ou sem dados no período.

## 4. Diretrizes de Arquitetura e Implementação
* **Serviço Interno (`tco-analytics.internal.service.ts`):** Orquestra o cruzamento assíncrono de bases relacionais (PostgreSQL/Prisma) e orientadas a documento (MongoDB), computando as métricas financeiras sob demanda ou via jobs agendados.
* **Testes Unitários Obrigatórios:** O arquivo `tco-analytics.service.spec.spec.ts` deve validar o cálculo correto do custo por quilômetro, a agregação de manutenções e pedágios, e o isolamento multi-tenant utilizando o **Vitest**.
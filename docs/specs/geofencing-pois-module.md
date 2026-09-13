# Specification: Geofencing & POI Module (Cercas Virtuais e Pontos de Interesse)

## 1. Visão Geral
O **GeofencingPoisModule** é o subsistema de inteligência espacial do **Biga Fleet Manager**. Ele gerencia o cadastro de **Pontos de Interesse (POIs)** (como garagens, clientes, fornecedores e zonas de risco) e **Cercas Virtuais (Geofences)** — delimitadas por polígonos geográficos ou raios circulares —, permitindo monitorar o momento exato em que os veículos entram ou saem dessas áreas monitoradas, sempre em conformidade com o multi-tenancy (`tenantId`).

## 2. Regras de Negócio e Domínio
* **Cadastro de POIs e Geofences:**
  * Todo POI ou cerca virtual pertence obrigatoriamente a um `tenantId`.
  * Tipos de POI suportados (`PoiType`): `BASE` (garagem/pátio), `CUSTOMER` (cliente/entrega), `SUPPLIER` (fornecedor), `RESTRICTED` (zona de exclusão/risco).
  * Geometria suportada: Coordenadas centrais com raio de tolerância (metros) ou polígonos geográficos compostos por arrays de coordenadas de latitude/longitude.
* **Cruzamento com Telemetria (Detecção de Eventos):**
  * O motor analítico cruza os pontos de telemetria recebidos em tempo real (`TelemetryModule`) com as cercas ativas do tenant.
  * Disparo de eventos de transição: **Entrada (`ENTER`)** e **Saída (`EXIT`)** de uma cerca virtual, gerando logs de auditoria e alertas operacionais.

## 3. Contratos de API (Endpoints)

### 3.1. Cadastrar Ponto de Interesse / Cerca Virtual
* **Método:** `POST /pois`
* **Payload (DTO Externo):**
  ```json
  {
    "tenantId": "uuid-v4",
    "name": "Matriz Assis - Pátio Principal",
    "type": "BASE",
    "latitude": -22.6582,
    "longitude": -50.4183,
    "radiusMeters": 250
  }
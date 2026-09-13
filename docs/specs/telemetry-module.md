# Specification: Telemetry Module (Módulo de Telemetria e IoT)

## 1. Visão Geral
O **TelemetryModule** é o motor de alta volumetria e processamento assíncrono do **Biga Fleet Manager**. Ele consome pacotes de dados brutos de IoT via barramento de mensagens (Redis Pub/Sub) e persiste os registros históricos e de auditoria no MongoDB, correlacionando diretamente a telemetria com os ativos (`Vehicle`) e as viagens ativas (`Trip`).

## 2. Regras de Negócio e Domínio
* **Ingestão Assíncrona de Alta Performance:**
  * Os dados de campo (posição GPS, velocidade, odômetro, satélites e status de ignição) chegam via eventos de mensageria e são processados em background para evitar gargalos na API REST principal.
* **Correlação com o Ciclo de Ignição:**
  * O processador de telemetria (`TelemetryProcessor`) monitora a transição de estado da ignição. Mudanças de `false` para `true` acionam a abertura lógica de viagens; a transição oposta dispara o encerramento do ciclo.
* **Armazenamento Desacoplado (MongoDB):**
  * Como a volumetria de pontos de telemetria cresce exponencialmente, o armazenamento relacional principal (PostgreSQL) é preservado apenas para entidades de domínio, enquanto o histórico contínuo de rastreio e telemetria é direcionado ao MongoDB.
* **Isolamento Multi-Tenant por Dispositivo/Veículo:**
  * Todo pacote ingerido deve validar o `tenantId` atrelado ao veículo remetente, rejeitando pacotes órfãos ou de origens não autorizadas.

## 3. Contratos de Ingestão e API de Consulta

### 3.1. Payload de Ingestão (Mensageria / Redis Pub/Sub)
* **Canal:** `telemetry:events`
* **Estrutura do Objeto (JSON):**
  ```json
  {
    "tenantId": "uuid-v4",
    "vehicleId": "uuid-v4-vehicle",
    "latitude": -22.6582,
    "longitude": -50.4183,
    "speed": 68.5,
    "ignition": true,
    "odometerKm": 12450.2,
    "timestamp": "2026-09-12T21:35:12Z"
  }
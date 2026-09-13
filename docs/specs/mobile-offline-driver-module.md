# Specification: Mobile & PWA Driver Module (Aplicativo de Campo Offline-First)

## 1. Visão Geral
O **MobileOfflineDriverModule** define as especificações para o aplicativo mobile (PWA / React Native) voltado aos motoristas e equipes de campo. Projetado com arquitetura **Offline-First**, o app permite a coleta de dados e inspeções mesmo em áreas rurais ou rodovias sem cobertura celular, sincronizando automaticamente com o backend assim que a conectividade é restabelecida.

## 2. Regras de Negócio e Domínio
* **Checklist Diário Pré-Viagem (Inspection):** Formulário obrigatório onde o motorista valida itens críticos (pneus, freios, fluidos, iluminação) e fotografa eventuais avarias. Dispara alertas automáticos para o `MaintenanceModule` caso encontre itens reprovados.
* **Diário de Bordo e Jornada (Lei do Motorista):** Registro formal de tempos de direção, paradas para descanso/refeição e abastecimentos, garantindo conformidade jurídica e trabalhista (Lei 13.103/2015).
* **Sincronização em Background (Sync Queue):** Fila local no dispositivo móvel que armazena transações offline e executa reenvios idempotentes ao recuperar o sinal de rede.

## 3. Contratos de API (Endpoints de Sincronização)

### 3.1. Sincronizar Lote de Eventos Offline
* **Método:** `POST /api/v1/mobile/sync`
* **Payload (DTO Externo - JSON Normalizado):**
  ```json
  {
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
    "driverId": "d1e2f3a4-b5c6-7890-abcd-ef0123456789",
    "deviceId": "mobile-device-xyz-99",
    "offlineActions": [
      {
        "actionId": "loc-uuid-001",
        "type": "CHECKLIST_SUBMISSION",
        "payload": {
          "vehicleId": "f1e2d3c4-b5a6-7890-abcd-ef0123456789",
          "status": "APPROVED_WITH_RESERVATIONS",
          "notes": "Farol auxiliar direito com lente trincada"
        },
        "capturedAt": "2026-09-13T00:45:00Z"
      }
    ]
  }
  ```
* **Respostas:**
  * `200 OK`: Confirmação de recebimento e reconciliação dos IDs locais com o servidor.

## 4. Diretrizes de Implementação
* **Persistência Local (IndexedDB / SQLite):** Garantir armazenamento seguro no dispositivo cliente.
* **Idempotência no Servidor:** O backend deve processar lotes de sincronização validando se o `actionId` já foi processado anteriormente, evitando duplicidade de registros.


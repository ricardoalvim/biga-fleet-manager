# Specification: Driver Recognition Module (Reconhecimento de Condutores e Jornada)

## 1. Visão Geral
O **DriverRecognitionModule** é o subsistema responsável por identificar, autenticar e monitorar o condutor vinculado a um ativo (`Vehicle`) no **Biga Fleet Manager**. Ele cruza eventos de telemetria com a jornada de trabalho, controle de CNH e identificação por dispositivos (RFID, biometria ou aplicativo mobile), garantindo conformidade regulatória (ex: Lei do Motorista) e rastreabilidade individualizada de infrações e estilo de direção.

## 2. Regras de Negócio e Domínio
* **Padrão de Payload e Integração Externa:**
  * Desenvolvido para receber eventos de identificação em tempo real vindos de hardwares de telemetria embarcada ou sistemas de RH/ponto via webhooks normalizados (sem espaçamentos indevidos e com tipagem estrita).
* **Vínculo de Condutor por Ativo/Viagem:**
  * Um motorista (`Driver`) deve estar obrigatoriamente associado a um `tenantId` e possuir validação ativa de CNH (categoria compatível com a biga).
  * O sistema registra o início e o fim da sessão de direção (`DrivingSession`), permitindo saber exatamente quem estava ao volante em um determinado intervalo de tempo ou ponto de telemetria.
* **Auditoria de Comportamento e Riscos:**
  * A identificação individual do condutor serve de base para correlacionar eventos de condução agressiva (frenagens bruscas, excesso de velocidade) e computar indicadores de risco para o TCO e segurança.

## 3. Contratos de API (Endpoints)

### 3.1. Cadastrar Condutor
* **Método:** `POST /api/v1/drivers`
* **Payload (DTO Externo - JSON Normalizado):**
  ```json
  {
    "tenantId":"a1b2c3d4-e5f6-7890-abcd-ef0123456789",
    "name":"Carlos Alberto da Silva",
    "taxId":"12345678901",
    "licenseNumber":"98765432100",
    "licenseCategory":"E",
    "licenseExpiresAt":"2028-11-30T23:59:59Z"
  }

  Respostas:

201 Created: Condutor cadastrado com sucesso.

409 Conflict: CPF (taxId) ou CNH já cadastrados no tenant.

3.2. Registrar Evento de Identificação (Webhook / Telemetria)
Método: POST /api/v1/drivers/authentication-events

Payload (DTO Externo - JSON Normalizado):

JSON
{
  "tenantId":"a1b2c3d4-e5f6-7890-abcd-ef0123456789",
  "vehicleId":"f1e2d3c4-b5a6-7890-abcd-ef0123456789",
  "driverTaxId":"12345678901",
  "authMethod":"RFID_TAG",
  "authenticatedAt":"2026-09-12T21:00:00Z"
}
Respostas:

201 Created: Sessão de direção vinculada com sucesso ao ativo.

404 Not Found: Motorista ou veículo não encontrados no escopo do tenant.

4. Diretrizes de Arquitetura e Implementação
Serviço Interno (driver-recognition.internal.service.ts): Orquestra a validação de vigência da CNH, abertura de sessões de direção e checagem de conflitos.

Testes Unitários Obrigatórios: O arquivo driver-recognition.service.spec.ts deve validar o cadastro de motoristas, bloqueio de CNH vencida ou duplicada e o vínculo correto de sessões via Vitest.
# Specification: Platform, Security & Ecosystem Module (Plataforma, Segurança e Ecossistema)

## 1. Visão Geral
Este módulo define os pilares transversais e de infraestrutura do **Biga Fleet Manager**. Ele rege a identidade e segurança (AuthN/AuthZ), a observabilidade sistêmica, a arquitetura de implantação híbrida (*Cloud* e *On-Premises*), as estratégias de migração de dados, o motor de customização por tenant (*White-label*), o painel de autoatendimento e o ecossistema de **Loja de Integrações (App Store / Marketplace de Webhooks e Plugins)**.

---

## 2. Pilares de Arquitetura e Domínio

### 2.1. Segurança e Autenticação (IAM & RBAC)
* **Padrão de Acesso:** Autenticação baseada em tokens JWT (OpenID Connect / OAuth 2.0) com suporte a *Single Sign-On (SSO)* corporativo (SAML/Azure AD).
* **Controle de Acesso Baseado em Papéis (RBAC + Tenant Scope):** Cada requisição valida rigidamente o escopo do `tenantId` (`x-tenant-id`) atrelado ao contexto, garantindo isolamento absoluto de dados entre clientes distintos.

### 2.2. Observabilidade (Telemetry & Health)
* **Métrica e Rastreio:** Exposição de métricas no padrão Prometheus (`/metrics`) e rastreamento distribuído (OpenTelemetry / Jaeger) para monitorar latência de banco, filas e gargalos de telemetria.
* **Logs Estruturados (JSON):** Logs de auditoria gerados no canal Redis `platform_events_stream`, contendo correlação de rastreio (`deliveryId`, `timestamp`, `tenantId`) para auditoria industrial.

### 2.3. Implantação Híbrida (Cloud vs. On-Premises)
* **Portabilidade Total:** O sistema é totalmente conteinerizado via Docker e orquestrado via Helm Charts / Kubernetes.
* **Modo On-Premises:** Permite empacotar o backend (NestJS), banco relacional (PostgreSQL), mensageria (Redis) e banco de documentos (MongoDB) para execução local em servidores fechados de clientes industriais ou agrícolas, mantendo a mesma paridade de código da versão em nuvem (*Cloud-Agnostic*).

### 2.4. Loja de Integrações e Barramento de Webhooks
* **Arquitetura Orientada a Eventos:** Plugins e serviços de terceiros (ERP SAP, TOTVS, sistemas de balança, SIG agrícola) conectam-se via Webhooks assinados criptograficamente.
* **Assinatura HMAC-SHA256 Obrigatória:** Cada disparo inclui o header `X-Biga-Signature` calculado a partir do payload JSON e do `secretToken` configurado:
  $$\text{Signature} = \text{"sha256="} + \text{HMAC-SHA256}(\text{payload}, \text{secretToken})$$
* **Ciclo de Vida do Webhook:** O sistema monitora falhas consecutivas (`failureCount`). Após 5 falhas consecutivas, o webhook transita de `ACTIVE` para `INACTIVE` para proteger a integridade do barramento.

### 2.5. Painel de Autoatendimento & Customização Multi-Tenant (*White-Label*)
* **Branding e Preferências Visuais:** Permite customizar nome de exibição (`displayName`), URL de logotipo (`logoUrl`) e paleta de cores primária e secundária em formato hexadecimal (`#RRGGBB`).
* **Habilitação de Módulos sob Demanda:** Gerenciamento dos módulos contratados pelo cliente (`enabledModules`: `VEHICLES`, `TRIPS`, `MAINTENANCE`, `INCIDENTS_TOLLS`, `ROUTE_PLANNING`, `TELEMETRY`).
* **Dicionário Terminológico Dinâmico:** Mapeamento de termos customizados por tenant para renderização fluida em aplicações Frontend.

---

## 3. Contratos de API de Plataforma (Endpoints REST)

Headers obrigatórios:
* `x-tenant-id`: UUID v4 do Tenant proprietário da conta.

### 3.1. Registrar Webhook Externo (Loja de Integrações)
* **Método:** `POST /api/v1/platform/webhooks`
* **Payload (JSON):**
  ```json
  {
    "name": "Integracao ERP SAP - Despacho de Frete",
    "targetUrl": "https://api.cliente-erp.com.br/webhooks/biga",
    "subscribedEvents": ["trip.finished", "maintenance.completed", "incident.registered"],
    "secretToken": "whsec_AbCdEf1234567890abcdef"
  }
  ```
  *(Nota: se `secretToken` for omitido, o sistema gera automaticamente uma chave criptográfica segura com prefixo `whsec_`)*.
* **Respostas:**
  - `201 Created`: Webhook registrado com sucesso.
  - `400 Bad Request`: URL inválida (não HTTP/HTTPS), lista de eventos vazia ou secretToken com menos de 16 caracteres.

### 3.2. Listar Webhooks do Tenant
* **Método:** `GET /api/v1/platform/webhooks`
* **Query Params:**
  - `status`: Opcional (`ACTIVE`, `INACTIVE`).
* **Respostas:**
  - `200 OK`: Lista de webhooks cadastrados ordenados por data de criação.

### 3.3. Consultar Detalhes do Webhook
* **Método:** `GET /api/v1/platform/webhooks/:id`
* **Respostas:**
  - `200 OK`: Detalhes do webhook.
  - `404 Not Found`: Webhook não encontrado (`PLATFORM-0001`).

### 3.4. Revogar e Remover Webhook
* **Método:** `DELETE /api/v1/platform/webhooks/:id`
* **Respostas:**
  - `200 OK`: `{ "deleted": true }`.
  - `404 Not Found`: Webhook não encontrado (`PLATFORM-0001`).

### 3.5. Disparar Evento de Teste Assinado
* **Método:** `POST /api/v1/platform/webhooks/:id/test`
* **Respostas:**
  - `200 OK`: `{ "success": true, "statusCode": 200, "deliveryId": "..." }`.
  - `404 Not Found`: Webhook não encontrado (`PLATFORM-0001`).

### 3.6. Consultar Configurações White-Label do Tenant
* **Método:** `GET /api/v1/platform/tenants/config`
* **Respostas:**
  - `200 OK`: Retorna as preferências visuais, paleta de cores, módulos habilitados e vocabulário customizado. Se o tenant for novo e não possuir configuração cadastrada, retorna valores padrão seguros (`Biga Fleet Manager`, `#1E3A8A`, `#3B82F6`, módulos ativos).

### 3.7. Atualizar Configurações White-Label do Tenant
* **Método:** `PUT /api/v1/platform/tenants/config`
* **Payload (JSON):**
  ```json
  {
    "displayName": "AgroTrans Logística Integrada",
    "logoUrl": "https://cdn.agrotrans.com.br/assets/logo.png",
    "primaryColor": "#047857",
    "secondaryColor": "#10B981",
    "enabledModules": ["VEHICLES", "TRIPS", "MAINTENANCE", "ROUTE_PLANNING"],
    "customTerminology": {
      "stopPointLabel": "Talhão",
      "assetLabel": "Trator"
    }
  }
  ```
* **Respostas:**
  - `200 OK`: Configurações salvas e normalizadas.
  - `400 Bad Request`: Formato de cor hexadecimal inválido (deve seguir `#RRGGBB` ou `#RGB`) ou campos obrigatórios vazios.

---

## 4. Tabela de Códigos de Erro de Negócio

| Código de Erro | HTTP Status | Descrição |
| :--- | :--- | :--- |
| `PLATFORM-0001` | 404 Not Found | Webhook não encontrado para o tenant informado |

---

## 5. Especificação dos Cabeçalhos HTTP de Disparo de Webhook

Ao enviar um evento para um webhook externo, o `PlatformEcosystemExternalService` anexa os seguintes cabeçalhos HTTP:

| Cabeçalho | Exemplo | Descrição |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Formato do payload serializado em JSON |
| `X-Biga-Signature` | `sha256=a1b2c3d4...` | Assinatura HMAC-SHA256 calculada com o `secretToken` |
| `X-Biga-Event` | `trip.finished` | Tipo de evento do ciclo de vida da frota disparado |
| `X-Biga-Delivery` | `c3d4e5f6-7890-...` | Identificador único de rastreio da entrega |
| `X-Biga-Tenant` | `00000000-0000-...` | UUID do tenant emissor para validação de escopo |
| `User-Agent` | `BigaFleetManager-Webhook/1.0` | Identificação do cliente HTTP da plataforma |

---

## 6. Verificação e Testes Unitários (Vitest)

* **Arquivos de Teste:**
  - `platform-ecosystem.internal.service.spec.ts`: 15 testes cobrindo ciclo de vida de webhooks, validação de URL, segredo automático seguro, despacho por evento/wildcard, resiliência multi-tenant, consulta com fallback padrão e validação de cores hexadecimais White-Label.
  - `platform-ecosystem.external.service.spec.ts`: 4 testes cobrindo envio HTTP assinado via HMAC-SHA256, cabeçalhos de entrega, auditoria no stream do Redis e tolerância a falhas externas de rede.
* **Status Geral da Suíte de Testes:**
  - **18 arquivos de teste** executados.
  - **128 testes aprovados (100% de sucesso)**.
  - Build NestJS compilado com código de saída 0 (`nest build`).
  - Linter ESLint 100% aprovado sem erros ou alertas (`npm run lint`).
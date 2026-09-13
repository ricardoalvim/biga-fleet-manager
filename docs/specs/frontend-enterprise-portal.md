# Specification: Frontend Enterprise Portal & SaaS Ecosystem (Painel, RBAC Dinâmico, Loja e Onboarding)

## 1. Visão Geral
O **Biga Frontend Enterprise Portal** é a interface de usuário e ecossistema operacional do **Biga Fleet Manager**. Desenvolvido em **React** (com TypeScript estrito e arquitetura modular baseada em componentes desacoplados), o portal foi concebido para atender a dois ecossistemas distintos e integrados: o **Painel Administrativo Global (Biga Admin)** e o **Painel do Cliente / Tenant (Multi-tenant White-Label)**. 

A interface é totalmente orientada a metadados e contratos imutáveis, suportando internacionalização plena (i18n), controle granular de permissões (RBAC customizável por menus/módulos), acompanhamento guiado de onboarding (da instalação do rastreador ao uso diário), central de suporte integrada e uma **Loja de Integrações gerada dinamicamente via consumo do Swagger/OpenAPI do backend**.

---

## 2. Pilares de Arquitetura e Requisitos de Negócio

### 2.1. Dualidade de Painéis (Admin Global vs. Cliente)
* **Painel Administrativo Global (`/admin`):** Restrito à equipe interna da Biga Fleet. Permite gerenciar inquilinos multi-tenant, habilitar/desabilitar módulos de software (`VEHICLES`, `TRIPS`, `MAINTENANCE`, `INCIDENTS_TOLLS`, `ROUTE_PLANNING`, `TELEMETRY`), monitorar a saúde global e intermediar o atendimento de suporte.
* **Painel do Cliente (`/app`):** Destinado aos operadores e gestores de cada tenant. É totalmente customizado via *White-Label* (logotipos, cores e vocabulário dinâmico conforme o contexto de negócio: *Delivery*, *Passenger*, *Heavy Cargo*, *Agricultural*).

### 2.2. Internacionalização Plena (i18n)
* Suporte nativo e instantâneo a 4 idiomas:
  * **Português do Brasil (`pt-BR`)**
  * **Inglês (`en-US`)**
  * **Espanhol (`es-ES`)**
  * **Alemão (`de-DE`)**
* Alternância dinâmica em tempo de execução via hook `useI18n` com persistência de preferências de usuário e tenant.

### 2.3. Onboarding Jornada de Adoção (Do Zero ao Uso em 5 Etapas)
Fluxo visual guiado de configuração inicial (*Wizard de Implantação*):
1. **Configuração de Tenant e White-Label (`ONBOARDING_TENANT_CONFIG`):** Identidade visual, logotipo e esquema de cores primária e secundária.
2. **Cadastro da Frota Tripartite (`ONBOARDING_FLEET_SETUP`):** Registro de veículos, proprietários e empresas contratadas/vinculadas.
3. **Instalação e Homologação IoT (`ONBOARDING_TRACKER_INSTALL`):** Validação de pacotes de telemetria recebidos dos protocolos Suntech, Queclink e Teltonika via Redis Streams e MongoDB.
4. **Atribuição de Motoristas e Regras Operacionais (`ONBOARDING_DRIVERS_GEOFENCE`):** Vinculação de motoristas habilitados, cercas eletrônicas e limites de velocidade.
5. **Conclusão e Liberação do Dashboard (`ONBOARDING_GO_LIVE`):** Homologação final, cálculo de 100% de prontidão e liberação irrestrita das rotas e telas operacionais.

### 2.4. RBAC Dinâmico e Customização de Menus por Papel
* O backend expõe o endpoint `GET /api/v1/portal/menus/me`, retornando apenas os itens autorizados para o perfil do usuário e ativados no licenciamento do tenant.
* Suporte a regras de permissão granulares e wildcards:
  * `*`: Acesso total de superadministrador.
  * `fleet:*`: Acesso total ao domínio de frota.
  * `fleet:vehicles:read`: Acesso estrito de leitura ao inventário de veículos.
* O componente frontend `DynamicMenuRenderer` renderiza os itens autorizados e aplica a identidade visual White-Label configurada no tenant.

### 2.5. Loja de Integrações Dinâmica (Swagger/OpenAPI-Driven Marketplace)
* A interface do marketplace (`SwaggerMarketplace`) consome dinamicamente o catálogo exposto em `GET /api/v1/portal/marketplace/catalog`, derivado da especificação OpenAPI do NestJS.
* Conectores de mercado mapeados:
  * **SAP Logistics & ERP Dispatch:** Sincronização de viagens, notas fiscais e custos de combustível.
  * **TOTVS / Protheus Manutenção:** Ordens de serviço preventivas e corretivas com apontamento de oficina.
  * **Sem Parar / Veloe / ConectCar:** Captura em tempo real de passagens em praças de pedágio e cálculo de evasão.
  * **HERE Fleet & OSRM Routing:** Roteirização com restrição de altura de viadutos e peso por eixo.
  * **Protocolo de Telemetria Multimarcas:** Recepção de pacotes brutos telemáticos via Redis.

### 2.6. Central de Chamados (Suporte Biga Fleet)
* Help desk operacional embutido com ciclo de vida formal:
  * Status: `OPEN` → `IN_PROGRESS` → `WAITING_CLIENT` → `RESOLVED` → `CLOSED`.
  * Categorias: `TECHNICAL`, `DEVICE_INTEGRATION`, `BILLING`, `ONBOARDING`, `GENERAL`.
  * Histórico em thread com marcação clara de mensagens de operadores e engenheiros da equipe de suporte Biga.

---

## 3. Arquitetura de Software e Implementação Backend (`src/platform/portal/`)

### 3.1. Entidades de Domínio
* **`RolePermissionEntity`:** Validação de formato de permissão, matching de wildcards (`hasPermission`) e imutabilidade de perfis de sistema.
* **`OnboardingJourneyEntity`:** Máquina de estados para as 5 etapas, cálculo automático do `progressPercentage` (0% a 100%) e validação de transições.
* **`SupportTicketEntity`:** Gestão do ciclo de vida de tickets, adição sequencial de mensagens de thread e registro de resolução.

### 3.2. Repositório e Persistência Hexagonal
* **`PortalRepository`:** Mapeamento tipado e desacoplado sobre os documentos Mongoose:
  * `PortalRoleDocument` (`roles_rbac`)
  * `PortalOnboardingDocument` (`portal_onboardings`)
  * `PortalTicketDocument` (`support_tickets`)

### 3.3. Serviços e Eventos
* **`PortalInternalService`:** Orquestração de regras de negócio, composição de menus dinâmicos com base em permissões e módulos ativos no `PlatformEcosystemRepository`.
* **`PortalExternalService`:** Emissão resiliente de eventos de mensageria Redis (`SUPPORT_TICKET_OPENED`, `SUPPORT_TICKET_UPDATED`, `ONBOARDING_STEP_UPDATED`, `TENANT_LICENSES_UPDATED`).
* **`PortalController`:** Endpoints REST documentados com anotações OpenAPI/Swagger:
  * `GET /api/v1/portal/menus/me`
  * `POST /api/v1/portal/roles`
  * `GET /api/v1/portal/roles`
  * `GET /api/v1/portal/roles/:id`
  * `GET /api/v1/portal/onboarding`
  * `PATCH /api/v1/portal/onboarding/steps/:stepIndex`
  * `POST /api/v1/portal/support/tickets`
  * `GET /api/v1/portal/support/tickets`
  * `GET /api/v1/portal/support/tickets/:id`
  * `PATCH /api/v1/portal/support/tickets/:id/reply`
  * `GET /api/v1/portal/admin/tenants`
  * `PATCH /api/v1/portal/admin/tenants/:tenantId/licenses`
  * `GET /api/v1/portal/marketplace/catalog`

---

## 4. Arquitetura Frontend (`frontend/src/`)

### 4.1. Componentes e Estrutura Modular
* **`types/portal.types.ts`:** Tipagem estrita compartilhada.
* **`i18n/`:** Dicionário completo de traduções e hook `useI18n` para troca de idiomas em tempo real.
* **`services/api.ts`:** Cliente HTTP tipado com injeção automática de `x-tenant-id`.
* **`rbac/usePermissions.ts`:** Hook para cálculo de autorizações por regra ou curinga.
* **`rbac/DynamicMenuRenderer.tsx`:** Navegação lateral reativa ao perfil ativo e estilizada com o White-Label do inquilino.
* **`onboarding/OnboardingWizard.tsx`:** Stepper visual com barra de progresso e formulário de anotações.
* **`admin/BigaAdminDashboard.tsx`:** Painel Superadmin para gestão de licenciamento e módulos contratados.
* **`app/TenantDashboard.tsx`:** Painel operacional do frotista com KPIs de veículos, viagens, alertas e atalhos rápidos.
* **`marketplace/SwaggerMarketplace.tsx`:** Vitrine de integrações externas orientada a OpenAPI.
* **`support/SupportCenter.tsx`:** Interface de tickets e conversas com suporte técnico.